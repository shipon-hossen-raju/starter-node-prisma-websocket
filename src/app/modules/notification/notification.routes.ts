import express from "express";
import auth from "../../middlewares/auth";
import { notificationController } from "./notification.controller";

const router = express.Router();

// router.post(
//   "/send-notification/:userId",
//   auth(),
//   notificationController.sendNotification
// );

// router.post(
//   "/send-notification",
//   auth(),
//   notificationController.sendNotifications
// );

// router.get("/", auth(), notificationController.getNotifications);
// router.get(
//   "/:notificationId",
//   auth(),
//   notificationController.getSingleNotificationById
// );

// get my notifications
router.get("/me", auth({}), notificationController.getMyNotifications);

// get my notifications
router.get("/", auth({}), notificationController.getAllNotifications);

// get specific notifications
router.get(
  "/:notificationId",
  auth({}),
  notificationController.getSingleNotifications
);

export const notificationsRoute = router;
