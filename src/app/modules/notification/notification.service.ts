import httpStatus from "http-status";
import ApiError from "../../../errors/ApiErrors";
import prisma from "../../../shared/prisma";

// // create notification
// const createNotification = async (data: any) => {
//   try {
//     const notification = await prisma.notification.create({
//       data,
//     });
//     return notification;
//   } catch (error: any) {
//     throw new ApiError(httpStatus.BAD_REQUEST, error.message);
//   }
// };
// const createInfoPost = async (postData: any) => {
//   const post = await prisma.infoPost.create({ data: postData });

//   const matchedUsers = await prisma.user.findMany({
//     where: {
//       profile: {
//         specificCategory: {
//           hasSome: post.multiCategory, // or post.singleCategory
//         },
//       },
//     },
//   });

//   await Promise.all(
//     matchedUsers.map((user) =>
//       prisma.notification.create({
//         data: {
//           userId: user.id,
//           title: "New post in your interest",
//           message: `A new post related to your interests has been added.`,
//           type: "CATEGORY_POST",
//           postId: post.id,
//         },
//       })
//     )
//   );

//   return post;
// };

// // Send notification to a single user
// const sendSingleNotification = async (
//   userId: string,
//   title: string,
//   body: string,
//   sender: string,
//   type: NotificationType = NotificationType.NORMAL
// ) => {
//   try {
//     if (!title || !body) {
//       throw new ApiError(400, "Title and body are required");
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     });
//     if (!user) {
//       throw new ApiError(
//         httpStatus.NOT_FOUND,
//         "User not found or FCM token not available"
//       );
//       // { massage: "FCM token not found" };
//     }

//     const message = {
//       notification: {
//         title,
//         body,
//       },
//       token: user.fcmToken!,
//     };

//     await prisma.notification.create({
//       data: {
//         receiverId: userId,
//         senderId: sender,
//         title,
//         body,
//         type,
//       },
//     });

//     if (!user.fcmToken) {
//       return { message: "FCM token not found" };
//     }
//     const response = await admin.messaging().send(message);
//     return response;
//   } catch (error: any) {
//     console.error("Error sending notification:", error);
//     if (error.code === "messaging/invalid-registration-token") {
//       throw new ApiError(400, "Invalid FCM registration token");
//     } else if (error.code === "messaging/registration-token-not-registered") {
//       throw new ApiError(404, "FCM token is no longer registered");
//     } else {
//       throw new ApiError(500, error.message || "Failed to send notification");
//     }
//   }
// };

// // Send notifications to all users with valid FCM tokens
// const sendNotifications = async (req: any) => {
//   try {
//     const { title, body } = req.body;

//     if (!title || !body) {
//       throw new ApiError(400, "Title and body are required");
//     }

//     const users = await prisma.user.findMany({
//       where: {
//         fcmToken: {
//           not: null,
//         },
//       },
//       select: {
//         id: true,
//         fcmToken: true,
//       },
//     });

//     if (!users || users.length === 0) {
//       throw new ApiError(404, "No users found with FCM tokens");
//     }

//     const fcmTokens = users.map((user) => user.fcmToken);

//     const message = {
//       notification: {
//         title,
//         body,
//       },
//       tokens: fcmTokens,
//     };

//     const response = await admin
//       .messaging()
//       .sendEachForMulticast(message as any);

//     const successIndices = response.responses
//       .map((res: any, idx: number) => (res.success ? idx : null))
//       .filter((_: any, idx: number) => idx !== null) as number[];

//     const successfulUsers = successIndices.map((idx) => users[idx]);

//     const notificationData = successfulUsers.map((user) => ({
//       receiverId: user.id,
//       senderId: req.user.id,
//       title,
//       body,
//     }));

//     await prisma.notification.createMany({
//       data: notificationData,
//     });

//     const failedTokens = response.responses
//       .map((res: any, idx: number) => (!res.success ? fcmTokens[idx] : null))
//       .filter((token): token is string => token !== null);

//     return {
//       successCount: response.successCount,
//       failureCount: response.failureCount,
//       failedTokens,
//     };
//   } catch (error: any) {
//     throw new ApiError(500, error.message || "Failed to send notifications");
//   }
// };

// // Fetch notifications for the current user
// const getNotificationsFromDB = async (req: any) => {
//   try {
//     const userId = req.user.id;

//     if (!userId) {
//       throw new ApiError(400, "User ID is required");
//     }

//     // 📨 Fetch notifications for the current user
//     const notifications = await prisma.notification.findMany({
//       where: {
//         receiverId: userId,
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             fullName: true,
//             profileImage: true,
//           },
//         },
//       },
//       orderBy: {
//         createdAt: "desc",
//       },
//     });

//     // Mark all as read
//     await prisma.notification.updateMany({
//       where: {
//         receiverId: userId,
//         isRead: false,
//       },
//       data: {
//         isRead: true,
//       },
//     });

//     // Return formatted response
//     return notifications.map((notification) => ({
//       id: notification.id,
//       title: notification.title,
//       body: notification.body,
//       isRead: true, // Force update local version to reflect DB change
//       createdAt: notification.createdAt,
//       sender: {
//         id: notification.sender.id,
//         fullName: notification.sender.fullName,
//         profileImage: notification.sender.profileImage,
//       },
//     }));
//   } catch (error: any) {
//     throw new ApiError(500, error.message || "Failed to fetch notifications");
//   }
// };

// // Fetch a single notification and mark it as read
// const getSingleNotificationFromDB = async (
//   req: any,
//   notificationId: string
// ) => {
//   try {
//     const userId = req.user.id;

//     // Validate user and notification ID
//     if (!userId) {
//       throw new ApiError(400, "User ID is required");
//     }

//     if (!notificationId) {
//       throw new ApiError(400, "Notification ID is required");
//     }

//     // Fetch the notification
//     const notification = await prisma.notification.findFirst({
//       where: {
//         id: notificationId,
//         receiverId: userId,
//       },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             fullName: true,

//             profileImage: true,
//           },
//         },
//       },
//     });

//     // Mark the notification as read
//     const updatedNotification = await prisma.notification.update({
//       where: { id: notificationId },
//       data: { isRead: true },
//       include: {
//         sender: {
//           select: {
//             id: true,
//             fullName: true,

//             profileImage: true,
//           },
//         },
//       },
//     });

//     // Return the updated notification
//     return {
//       id: updatedNotification.id,
//       title: updatedNotification.title,
//       body: updatedNotification.body,
//       isRead: updatedNotification.isRead,
//       createdAt: updatedNotification.createdAt,
//       sender: {
//         id: updatedNotification.sender.id,
//         fullName: updatedNotification.sender.fullName,

//         profileImage: updatedNotification.sender.profileImage,
//       },
//     };
//   } catch (error: any) {
//     throw new ApiError(500, error.message || "Failed to fetch notification");
//   }
// };

// get my notifications
const getMyNotifications = async (userId: string) => {
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const notifications = await prisma.notification.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

// get all notifications
const getAllNotifications = async () => {
  const notifications = await prisma.notification.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

// get specific notifications
const getSingleNotifications = async (
  userId: string,
  notificationId: string
) => {
  if (!notificationId)
    return new ApiError(httpStatus.NOT_FOUND, "Notification id is required");

  // check if notification exists
  const notification = await prisma.notification.findFirst({
    where: {
      userId: userId,
      id: notificationId,
    },
  });

  return notification;
};

export const notificationServices = {
  // sendSingleNotification,
  // sendNotifications,
  // getNotificationsFromDB,
  // getSingleNotificationFromDB,
  getMyNotifications,
  getAllNotifications,
  getSingleNotifications,
};
