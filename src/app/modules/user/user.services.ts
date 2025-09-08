import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { OTPFn } from "../../../helpars/OTPFn";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import emailSender from "../../../shared/emailSender";
import prisma from "../../../shared/prisma";
import { userSearchAbleFields } from "./user.costant";
import { IUser, IUserFilterRequest } from "./user.interface";
import { OtpHtml } from "./user.mail";

// Create a new user in the database.
const createUserIntoDb = async (
  payload: User & { confirmPassword?: string }
) => {
  // Remove confirmPassword from payload
  const { confirmPassword, ...userPayload } = payload;
  if (confirmPassword !== userPayload.password) {
    throw new ApiError(400, "Password and confirmPassword do not match!");
  }

  // Use a transaction for user creation and related actions
  const result = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findFirst({
      where: {
        email: userPayload.email,
      },
    });

    if (existingUser) {
      if (existingUser.email === userPayload.email) {
        throw new ApiError(
          400,
          `User with this email ${userPayload.email} already exists`
        );
      }
    }
    const hashedPassword: string = await bcrypt.hash(
      userPayload.password,
      Number(config.bcrypt_salt_rounds)
    );

    const createdUser = await tx.user.create({
      data: {
        ...userPayload,
        password: hashedPassword,
        fcmToken: userPayload.fcmToken,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // send email to user otp (outside transaction for best practice, but included here for atomicity)
    const otp = await OTPFn(createdUser.email);
    await emailSender(
      createdUser.email,
      OtpHtml(otp.otp, otp.expiry as Date),
      `Welcome to our service! Your OTP is: ${otp.otp}`
    );

    return;
  });

  return;
};

// reterive all users from the database also searching anf filtering
const getUsersFromDb = async (
  params: IUserFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }
  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const total = await prisma.user.count({
    where: whereConditions,
  });

  if (!result || result.length === 0) {
    throw new ApiError(404, "No active users found");
  }
  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// update profile by user won profile uisng token or email and id
const updateProfile = async (req: Request) => {
  const file = req.file;
  const stringData = req.body.data;
  let image;
  let parseData;
  const existingUser = await prisma.user.findFirst({
    where: {
      id: req.user.id,
    },
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }
  if (file) {
    image = (await fileUploader.uploadToDigitalOcean(file)).Location;
  }
  if (stringData) {
    parseData = JSON.parse(stringData);
  }
  const result = await prisma.user.update({
    where: {
      id: existingUser.id, // Ensure `existingUser.id` is valid and exists
    },
    data: {
      name: parseData.name || existingUser.name,
      email: parseData.email || existingUser.email,
      profileImage: image || existingUser.profileImage,
      updatedAt: new Date(), // Assuming your model has an `updatedAt` field
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
  });

  return result;
};

// update user data into database by id fir admin
const updateUserIntoDb = async (payload: IUser, id: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: id,
    },
  });
  if (!userInfo)
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);

  const result = await prisma.user.update({
    where: {
      id: userInfo.id,
    },
    data: payload,
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!result)
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to update user profile"
    );

  return result;
};

// profile image upload or change
const profileImageChange = async (req: Request) => {
  const file = req.file;
  if (file) {
    const image = (await fileUploader.uploadToDigitalOcean(file)).Location;

    return await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        profileImage: image,
      },
    });
  }

  return null;
};

// delete user from db
const deleteUserFromDb = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);
  }

  const result = await prisma.user.update({
    where: { id },
    data: { status: "DELETED" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      updatedAt: true,
    },
  });

  return result;
};

export const userService = {
  createUserIntoDb,
  getUsersFromDb,
  updateProfile,
  updateUserIntoDb,
  deleteUserFromDb,
  profileImageChange,
};
