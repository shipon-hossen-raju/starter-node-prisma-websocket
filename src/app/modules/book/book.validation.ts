import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Name is required"),
  writerName: z.string().min(1, "Writer Name is required"),
  description: z.string().min(1, "Description is required"),
  aboutBook: z.string().min(1, "About Book is required"),
  thumbnail: z.string().optional(),
  featuredRelease: z.boolean().optional().default(false),
  bookPdf: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

const updateSchema = z.object({
});

export const bookValidation = {
  createSchema,
  updateSchema,
};
