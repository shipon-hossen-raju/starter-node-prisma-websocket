import { z } from "zod";

const changePasswordValidationSchema = z.object({
  oldPassword: z.string().min(1, "Password is required"),
  newPassword: z.string().min(1, "New Password is required"),
  confirmNewPassword: z.string().min(1, "Confirm New Password is required"),
});

export const authValidation={
    changePasswordValidationSchema
}