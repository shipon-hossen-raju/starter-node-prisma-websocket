import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import ApiError from "../../../errors/ApiErrors";
import { jwtHelpers } from "../../../helpars/jwtHelpers";
import { OTPFn } from "../../../helpars/OTPFn";
import emailSender from "../../../shared/emailSender";
import prisma from "../../../shared/prisma";
import { ForgotOtpHtml, ResendOtpHtml } from "./auth.mail";

// user login
const loginUser = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
  lat?: number;
  lon?: number;
}) => {
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      password: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      profileImage: true,
    },
  });

  if (!userData?.email) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! with this email " + payload.email
    );
  }
  if (userData.status !== "ACTIVE") {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "User account already delete or Block."
    );
  }

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect!");
  }

  // update fcm token
  if (payload.fcmToken) {
    await prisma.user.update({
      where: { email: payload.email },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email,
      role: userData.role,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const { password, ...withoutPassword } = userData;

  return { token: accessToken, userData: withoutPassword };
};

// get user profile
const getMyProfile = async (userId: string) => {
  const userProfile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      role: true,
      phoneNumber: true,
      status: true,
      email: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return userProfile;
};

// change password
const changePassword = async (
  userId: string,
  newPassword: string,
  oldPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await bcrypt.compare(oldPassword, user?.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect old password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
    select: {
      id: true,
    },
  });
  return { message: "Password changed successfully" };
};

// forgot password
const forgotPassword = async (payload: { email: string }) => {
  // Fetch user data or throw if not found
  const userData = await prisma.user.findFirstOrThrow({
    where: {
      email: payload.email,
    },
  });

  // Send the OTP email to the user
  const otp = await OTPFn(userData.email);
  await emailSender(
    userData.email,
    ForgotOtpHtml(otp.otp, otp.expiry as Date),
    `Forgot Password OTP: ${otp.otp}`
  );

  return { message: "Reset password OTP sent to your email successfully" };
};

// resend otp
const resendOtp = async (email: string) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const otp = await OTPFn(user.email);
  await emailSender(
    user.email,
    ResendOtpHtml(otp.otp, otp.expiry as Date),
    `Reset Password OTP: ${otp.otp}`
  );

  return { message: "OTP resent successfully" };
};

// ##ISSUE PENDING otp time validation not perfectly working
const verifyOtp = async (payload: {
  email: string;
  verificationCode: string | number;
}) => {
  const otp = await prisma.otp.findUnique({
    where: { email: payload.email },
    select: { id: true, expiry: true, otp: true, email: true },
  });

  if (!otp) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  const now = new Date().getTime();
  // const findExpiredOTP = await prisma.otp.findUnique({
  //   where: { email: payload.email, otp: { gt: new Date(now).getTime() } },
  // });
  // console.log("findExpiredOTP ", findExpiredOTP);

  // Expiry check
  if (otp.expiry.getTime() < now) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP expired");
  }

  // OTP check (string comparison avoids leading zero issues)
  if (String(otp.otp) !== String(payload.verificationCode)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  // Delete OTP after successful verification
  await prisma.otp.deleteMany({
    where: { email: payload.email },
  });

  return { message: "OTP verification successful" };
};

// reset password
const resetPassword = async (payload: { password: string; email: string }) => {
  // Check if the user exists
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found!");
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(payload.password, 10);

  // Update the user's password in the database
  await prisma.user.update({
    where: { email: payload.email },
    data: {
      password: hashedPassword,
    },
  });

  return { message: "Password reset successfully" };
};

export const AuthServices = {
  loginUser,
  getMyProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  resendOtp,
  verifyOtp,
};
