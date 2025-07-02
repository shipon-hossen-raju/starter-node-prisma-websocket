import { Prisma, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import { userSearchAbleFields } from "./user.costant";
import { IUser, IUserFilterRequest } from "./user.interface";

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
    // await emailSender(
    //   createdUser.email,
    //   OtpHtml(otp),
    //   `Welcome to our service! Your OTP is: ${otp}`
    // );

    return createdUser;
  });

  const token = jwtHelpers.generateToken(
    {
      id: result.id,
      email: result.email,
      role: result.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  return { result, token };
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
      firstName: true,
      lastName: true,
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
      firstName: parseData.firstName || existingUser.firstName,
      lastName: parseData.lastName || existingUser.lastName,
      email: parseData.email || existingUser.email,
      profileImage: image || existingUser.profileImage,
      updatedAt: new Date(), // Assuming your model has an `updatedAt` field
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      profileImage: true,
    },
  });

  return result;
};

// const completeProfileIntoDB = async (req: Request) => {
//   const file = req.file;
//   const stringData = req.body.data;

//   return await prisma.$transaction(async (tx) => {
//     let image;
//     let parseData;

//     const existingUser = await tx.user.findFirst({
//       where: {
//         id: req.user.id,
//       },
//     });
//     if (!existingUser) {
//       throw new ApiError(404, "User not found");
//     }

//     // image file image
//     if (file) {
//       image = (await fileUploader.uploadToDigitalOcean(file)).Location;

//       await tx.user.update({
//         where: {
//           id: existingUser.id,
//         },
//         data: {
//           profileImage: image,
//         },
//       });
//     }
//     if (stringData) {
//       parseData = JSON.parse(stringData);
//     }

//     const existingProfile = await tx.profile.findFirst({
//       where: {
//         userId: existingUser.id,
//       },
//     });

//     const businessProfileData = {
//       userId: existingUser.id,
//       einNumber: parseData.einNumber,
//       naicsCode: parseData.naicsCode,
//       businessName: parseData.businessName,
//       website: parseData.website,
//       description: parseData.description,
//       socialMediaTags: parseData.socialMediaTags,
//       specificCategory: parseData.specificCategory,
//     };

//     const consumerProfileData = {
//       userId: existingUser.id,
//       socialMediaTags: parseData.socialMediaTags,
//     };

//     const profileData =
//       existingUser.role === "BUSINESS"
//         ? businessProfileData
//         : consumerProfileData;

//     // exiting profile update or create
//     if (!existingProfile) {
//       // If profile does not exist, create it
//       const createdProfile = await tx.profile.create({
//         data: profileData,
//         include: {
//           user: {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               profileImage: true,
//               isCompleteProfile: true,
//             },
//           },
//         },
//       });

//       await tx.user.update({
//         where: {
//           id: existingUser.id,
//         },
//         data: {
//           isCompleteProfile: true,
//           location: parseData.location,
//         },
//       });

//       return { profileData: createdProfile, status: 201 };
//     }

//     // user update
//     await tx.user.update({
//       where: {
//         id: existingUser.id,
//       },
//       data: {
//         isCompleteProfile: true,
//       },
//     });

//     const updateProfile = await tx.profile.update({
//       where: {
//         userId: existingUser.id,
//       },
//       data: profileData,
//       include: {
//         user: {
//           select: {
//             id: true,
//             fullName: true,
//             email: true,
//             profileImage: true,
//             isCompleteProfile: true,
//           },
//         },
//       },
//     });

//     return { profileData: updateProfile, status: 200 };
//   });
// };

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
      firstName: true,
      lastName: true,
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

// account update
// const accountUpdateIntoDb = async (payload: any, id: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);
//   }

//   const updatedUser = await prisma.user.update({
//     where: { id },
//     data: {
//       firstName: payload?.fullName ?? user.firstName,
//       lastName: payload?.lastName ?? user.lastName,
//       email: payload?.email ?? user.email,
//       phoneNumber: payload?.phoneNumber ?? user.phoneNumber,
//       lat: payload?.lat ?? user.lat,
//       lon: payload?.lon ?? user.lon,
//       updatedAt: new Date(),
//     },
//     select: {
//       id: true,
//       firstName: true,
//       lastName: true,
//       email: true,
//       phoneNumber: true,
//       profileImage: true,
//       lat: true,
//       lon: true,
//       updatedAt: true,
//     },
//   });

//   const findProfile = await prisma.profile.findFirst({
//     where: {
//       userId: user.id,
//     },
//   });

//   if (!findProfile) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found with id: " + id);
//   }

//   const updatedProfile = await prisma.profile.update({
//     where: {
//       userId: user.id,
//     },
//     data: {
//       businessName: payload?.businessName ?? findProfile?.businessName,
//       einNumber: payload?.einNumber ?? findProfile?.einNumber,
//       naicsCode: payload?.naicsCode ?? findProfile?.naicsCode,
//       website: payload?.website ?? findProfile?.website,
//       description: payload?.description ?? findProfile?.description,
//       socialMediaTags: payload?.socialMediaTags ?? findProfile?.socialMediaTags,
//       specificCategory:
//         payload?.specificCategory ?? findProfile?.specificCategory,
//     },
//   });

//   return { updatedUser, updatedProfile };
// };

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
    data: { status: "INACTIVE" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
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
  // accountUpdateIntoDb,
  // completeProfileIntoDB,
  deleteUserFromDb,
  profileImageChange,
};
