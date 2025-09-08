import { UserRole } from "@prisma/client";
import { z } from "zod";

const CreateUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z
    .string()
    .nonempty("Password is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  confirmPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .nonempty("Password is required").optional(),
  role: z.nativeEnum(UserRole),
  fcmToken: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});

const UserLoginValidationSchema = z.object({
  email: z.string().email().nonempty("Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .nonempty("Password is required"),
  fcmToken: z.string().optional(),
  lat: z.number().optional(),
  lon: z.number().optional(),
});


export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema
};
