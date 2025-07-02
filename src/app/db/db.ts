import { UserRole } from "@prisma/client";
import prisma from "../../shared/prisma";
import * as bcrypt from "bcrypt";
import config from "../../config";
export const initiateSuperAdmin = async () => {
  const hashedPassword=await bcrypt.hash('123456789',Number(config.bcrypt_salt_rounds))
  const payload: any = {
    firstName: "Super",
    lastName: "Admin",
    email: "admin@gmail.com",
    phoneNumber: "012635415845",
    password: hashedPassword,
    role: UserRole.ADMIN,
  };

  const isExistUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isExistUser) return;

  await prisma.user.create({
    data: payload,
  });
};
