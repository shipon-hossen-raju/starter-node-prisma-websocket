import { UserRole } from "@prisma/client";
import express from "express";
import { fileUploader } from "../../../helpars/fileUploader";
import auth from "../../middlewares/auth";
import { bookController } from "./book.controller";

const router = express.Router();

router.post(
  "/create",
  auth({}),
  fileUploader.bookUpload,
  bookController.createBook
);

router.get("/", auth({}), bookController.getBookList);

router.get(
  "/single/:id",
  auth({ isOptional: true }),
  bookController.getBookById
);

router.put(
  "/update/:id",
  auth({}),
  fileUploader.bookUpload,
  bookController.updateBook
);

router.delete(
  "/delete/:id",
  auth({ roles: [UserRole.ADMIN] }),
  bookController.deleteBook
);

export const bookRoutes = router;
