import { z } from "zod";

const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(1, "Password is required"),
  newPassword: z.string().min(1, "New Password is required"),
  confirmNewPassword: z.string().min(1, "Confirm New Password is required"),
});

const resetPasswordValidationSchema = z.object({
  password: z.string().min(1, "Password is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
});

export const authValidation = {
  changePasswordValidationSchema,
  resetPasswordValidationSchema,
};