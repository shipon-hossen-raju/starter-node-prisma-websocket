import express from "express";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "./user.validation";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpars/fileUploader";

const router = express.Router();

// *!register user
router.post(
  "/register",
  validateRequest(UserValidation.CreateUserValidationSchema),
  userController.createUser
);

// complete profile
// router.post(
//   "/complete-profile",
//   // validateRequest(UserValidation.userProfileComplete),
//   auth(),
//   fileUploader.uploadSingle,
//   userController.completeProfile
// );

// image upload
router.put("/profile-image", auth(), fileUploader.uploadSingle, userController.profileImageChange);

// *!update  user
router.put("/:id", auth(), userController.updateUser);

// account update
// router.patch(
//   "/account-update",
//   validateRequest(UserValidation.userOptionalProfileSchema),
//   auth(),
//   userController.accountUpdate
// );

// delete me
router.delete("/delete-me", auth(), userController.deleteMe);


export const userRoutes = router;
