import express from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { userController } from "./user.controller";
import { UserValidation } from "./user.validation";

const router = express.Router();

// *!register user
router.post(
  "/register",
  validateRequest(UserValidation.CreateUserValidationSchema),
  userController.createUser
);

// image upload
router.put(
  "/profile-image",
  auth({}),
  fileUploader.uploadSingle,
  userController.profileImageChange
);

// *!update  user
router.put(
  "/profile-update",
  auth({}),
  fileUploader.uploadSingle,
  userController.updateUser
);

// delete me
router.delete("/delete-me", auth({}), userController.deleteMe);

export const userRoutes = router;
