import { UserRole } from "@prisma/client";
import { z } from "zod";

const CreateUserValidationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  password: z.string().nonempty("Password is required"),
  confirmPassword: z.string().nonempty("Confirm Password is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  role: z.nativeEnum(UserRole),
  fcmToken: z.string().optional(),
});

const UserLoginValidationSchema = z.object({
  email: z.string().email().nonempty("Email is required"),
  password: z
    .string()
    .nonempty("Password is required"),
  fcmToken: z.string().optional(),
});


export const UserValidation = {
  CreateUserValidationSchema,
  UserLoginValidationSchema
};
