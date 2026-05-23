import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import dotenv from "dotenv";
import httpStatus from "http-status";
import multer from "multer";
import config from "../config";
import ApiError from "../errors/ApiErrors";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

// Extract public_id from Cloudinary URL for deletion
function extractFilePathFromUrl(fileUrl: string): string | null {
  try {
    const u = new URL(fileUrl);
    const parts = u.pathname.split("/");
    const uploadIndex = parts.indexOf("upload");
    if (uploadIndex === -1) return null;
    const relevantParts = parts.slice(uploadIndex + 1);
    // Remove version segment (v1234567890) if present
    if (/^v\d+$/.test(relevantParts[0])) relevantParts.shift();
    // Remove file extension
    const lastPart = relevantParts[relevantParts.length - 1];
    relevantParts[relevantParts.length - 1] = lastPart.replace(/\.[^/.]+$/, "");
    return relevantParts.join("/");
  } catch {
    return null;
  }
}

// Delete file from Cloudinary using the URL
export async function deleteFileFromCloud({ fileUrl }: { fileUrl: string }) {
  if (!fileUrl) return;

  if (!fileUrl.includes("cloudinary.com")) return;

  const filePath = extractFilePathFromUrl(fileUrl);
  if (!filePath)
    throw new ApiError(
      404,
      "Invalid file URL. Could not extract Cloudinary public_id.",
    );

  const isVideo = /\/video\/upload\//.test(fileUrl);
  const result = await cloudinary.uploader.destroy(filePath, {
    resource_type: isVideo ? "video" : "image",
  });
  return result;
}

// Multer configuration using memoryStorage
// 50MB hard ceiling at multer level; per-plan check service layer e
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

// Upload single image / file
const uploadSingle = upload.single("image");
const uploadFile = upload.single("file");

// Upload multiple images / files
const uploadMultipleImage = upload.fields([{ name: "images", maxCount: 15 }]);
const uploadMultipleFiles = upload.fields([{ name: "files", maxCount: 15 }]);

// Upload profile and banner images
const updateProfile = upload.fields([
  { name: "profile", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

// Upload project images + videos
const projectsImages = upload.fields([
  { name: "thumbnail", maxCount: 1 },
  { name: "photos", maxCount: 15 },
  { name: "videos", maxCount: 5 },
]);

type folderType =
  | "category"
  | "uploads"
  | "projects"
  | "service"
  | "user"
  | "certification"
  | "chat";

// Upload directly to Cloudinary from buffer
const uploadToCloud = async ({
  file,
  folder = "uploads",
}: {
  file: Express.Multer.File;
  folder: folderType;
}): Promise<{ Location: string; Key: string }> => {
  if (!file) {
    throw new ApiError(400, "File is required for uploading.");
  }

  return new Promise((resolve, reject) => {
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}_${sanitizedName.replace(/\.[^/.]+$/, "")}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          console.error("Error uploading file to Cloudinary:", error);
          return reject(error);
        }
        resolve({
          Location: result.secure_url,
          Key: result.public_id,
        });
      },
    );

    uploadStream.end(file.buffer);
  });
};

// Upload buffer directly to Cloudinary (e.g. generated images, screenshots)
export async function uploadBufferToCloud({
  buffer,
  folder = "uploads",
}: {
  buffer: Buffer;
  folder?: folderType;
}): Promise<{ Location: string; Key: string }> {
  if (!buffer?.length)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Buffer is required for uploading.",
    );

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}_${crypto.randomBytes(6).toString("hex")}`,
        resource_type: "image",
        format: "png",
      },
      (error, result) => {
        if (error || !result) {
          return reject(error);
        }
        resolve({
          Location: result.secure_url,
          Key: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export const fileUploader = {
  upload,
  uploadSingle,
  uploadMultipleFiles,
  uploadMultipleImage,
  updateProfile,
  projectsImages,
  uploadFile,
  uploadToCloud,
  uploadBufferToCloud,
  deleteFileFromCloud,
};
