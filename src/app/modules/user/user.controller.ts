import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import pick from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { userFilterableFields } from "./user.costant";
import { userService } from "./user.services";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createUserIntoDb(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Registered successfully!",
    data: result,
  });
});

// get all user form db
const getUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await userService.getUsersFromDb(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users retrieve successfully!",
    data: result,
  });
});

// get all user form db
const updateProfile = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const user = req?.user;

    const result = await userService.updateProfile(req);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated successfully!",
      data: result,
    });
  }
);

// complete profile
// const completeProfile = catchAsync(
//   async (req: Request & { user?: any }, res: Response) => {
//     const { profileData, status } = await userService.completeProfileIntoDB(
//       req
//     );

//     sendResponse(res, {
//       statusCode: status,
//       success: true,
//       message: `Profile ${
//         status === 201 ? "created" : "updated"
//       } successfully!`,
//       data: profileData,
//     });
//   }
// );

// *! update user role and account status
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await userService.updateUserIntoDb(req.body, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully!",
    data: result,
  });
});

// *! update user role and account status
const profileImageChange = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await userService.profileImageChange(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User updated successfully!",
    data: result,
  });
});

// *! update user role and account status
// const accountUpdate = catchAsync(async (req: Request, res: Response) => {
//   const id = req.user.id;
//   const result = await userService.accountUpdateIntoDb(req.body, id);
  
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: "User account updated successfully!",
//     data: result,
//   });
// });

// *! delete user
const deleteMe = catchAsync(async (req: Request, res: Response) => {
  const id = req.user.id;
  const result = await userService.deleteUserFromDb(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Deleted successfully!",
    data: result,
  });
});

export const userController = {
  createUser,
  getUsers,
  updateProfile,
  updateUser,
  // accountUpdate,
  // completeProfile,
  deleteMe,
  profileImageChange,
};
