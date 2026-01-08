import { Prisma, UserRole } from "@prisma/client";
import { Request } from "express";
import httpStatus from "http-status";
import { z } from "zod";
import ApiError from "../../../errors/ApiErrors";
import { fileUploader } from "../../../helpars/fileUploader";
import { paginationHelper } from "../../../helpars/paginationHelper";
import { IPaginationOptions } from "../../../interfaces/paginations";
import prisma from "../../../shared/prisma";
import { slugCreate } from "../../../utils/slugCreate";
import { bookSearchAbleFields } from "./book.constant";
import { TBookFilterAbleFields } from "./book.interface";
import { bookValidation } from "./book.validation";

type TPayloadBook = z.infer<typeof bookValidation.createSchema> & {
  slug?: string;
};
interface TBookUploadFiles {
  thumbnail?: Express.Multer.File[];
  bookPdf?: Express.Multer.File[];
}
// book create
const createIntoDb = async (req: Request) => {
  const userId = req.user.id;
  const bodyData: TPayloadBook = JSON.parse(req.body.data || "{}");
  const validate = bookValidation.createSchema.safeParse(bodyData);
  if (!validate.success) {
    throw new ApiError(httpStatus.BAD_REQUEST, validate.error.message);
  }
  const data: TPayloadBook = validate.data;
  const thumbnailFile = (req.files as TBookUploadFiles)?.thumbnail;
  const bookPdfFile = (req.files as TBookUploadFiles)?.bookPdf;
  if (!thumbnailFile) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Thumbnail is required");
  }
  if (!bookPdfFile) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Book PDF is required");
  }
  const slug = slugCreate(data.title);

  const findSlug = await prisma.book.findUnique({ where: { slug } });
  if (findSlug) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Slug already exists");
  }

  // file upload and create book
  const thumbnail = await fileUploader.uploadToCloudinary(thumbnailFile[0]);
  const bookPdf = await fileUploader.uploadToCloudinary(bookPdfFile[0]);
  data.thumbnail = thumbnail.Location;
  data.bookPdf = bookPdf.Location;

  const transaction = await prisma.$transaction(async (prisma) => {
    const result = await prisma.book.create({
      data: {
        ...data,
        userId,
        slug,
      },
    });
    return result;
  });

  return transaction;
};

const getListFromDb = async (
  params: TBookFilterAbleFields,
  options: IPaginationOptions,
  role?: UserRole
) => {
  const { page, limit, skip, sortByCondition } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, isActive, ...filterData } = params;

  const andConditions: Prisma.BookWhereInput[] = [];

  if (params.searchTerm) {
    andConditions.push({
      OR: bookSearchAbleFields.map((field) => ({
        [field]: {
          contains: params?.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  // if user role admin
  if (role === UserRole.ADMIN && isActive) {
    andConditions.push({
      isActive: isActive === "true" ? true : false,
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
  const whereConditions: Prisma.BookWhereInput = { AND: andConditions };

  const result = await prisma.book.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: sortByCondition,
  });
  const total = await prisma.book.count({
    where: whereConditions,
  });
  return {
    meta: {
      total,
      page,
      limit,
    },
    result,
  };
};

const getByIdFromDb = async (id: string, userId?: string) => {
  const result = await prisma.book.findUnique({
    where: { id, ...(userId && { isActive: true }) },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
  }
  return result;
};

// book update
const updateIntoDb = async (
  id: string,
  payload: Partial<TPayloadBook>,
  files?: TBookUploadFiles
) => {
  // check existing book
  const existingBook = await prisma.book.findUnique({
    where: { id },
  });

  if (!existingBook) {
    throw new ApiError(httpStatus.NOT_FOUND, "Book not found");
  }

  console.log("payload", payload);

  // validate payload (partial)
  const validate = bookValidation.createSchema.partial().safeParse(payload);

  if (!validate.success) {
    throw new ApiError(httpStatus.BAD_REQUEST, validate.error.message);
  }

  const updateData: Partial<TPayloadBook> = validate.data;

  /* ---------- SLUG UPDATE ---------- */
  if (updateData.title && updateData.title !== existingBook.title) {
    const newSlug = slugCreate(updateData.title);

    const slugExists = await prisma.book.findFirst({
      where: {
        slug: newSlug,
        NOT: { id },
      },
    });

    if (slugExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Slug already exists");
    }

    updateData.slug = newSlug;
  }

  /* ---------- FILE UPDATES ---------- */
  if (files?.thumbnail?.length) {
    const thumbnailUpload = await fileUploader.uploadToCloudinary(
      files.thumbnail[0]
    );
    updateData.thumbnail = thumbnailUpload.Location;
  }

  if (files?.bookPdf?.length) {
    const bookPdfUpload = await fileUploader.uploadToCloudinary(
      files.bookPdf[0]
    );
    updateData.bookPdf = bookPdfUpload.Location;
  }

  /* ---------- TRANSACTION ---------- */
  const transaction = await prisma.$transaction(async (prisma) => {
    const updatedBook = await prisma.book.update({
      where: { id },
      data: updateData,
    });

    return updatedBook;
  });

  return transaction;
};

const deleteItemFromDb = async (id: string) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    const deletedItem = await prisma.book.delete({
      where: { id },
    });

    // Add any additional logic if necessary, e.g., cascading deletes
    return deletedItem;
  });

  return transaction;
};
export const bookService = {
  createIntoDb,
  getListFromDb,
  getByIdFromDb,
  updateIntoDb,
  deleteItemFromDb,
};
