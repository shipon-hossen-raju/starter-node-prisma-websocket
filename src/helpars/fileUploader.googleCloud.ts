import { Storage } from "@google-cloud/storage";
import crypto from "crypto";
import dotenv from "dotenv";
import httpStatus from "http-status";
import multer from "multer";
import path from "path";
import config from "../config";
import ApiError from "../errors/ApiErrors";

dotenv.config();

// Configure Google Cloud Storage
const storageClient = new Storage({
  projectId: config.gcs.projectId,
  credentials: {
    client_email: config.gcs.clientEmail,
    private_key: config.gcs.privateKey?.replace(/\\n/g, "\n"),
  },
});

const bucketName = config.gcs.bucketName as string;
const bucket = storageClient.bucket(bucketName);

// Extract file path (object name) from a GCS public URL for deletion
// GCS public URL format: https://storage.googleapis.com/{bucket}/{folder}/{filename}
function extractFilePathFromUrl(fileUrl: string): string | null {
  try {
    const u = new URL(fileUrl);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    if (parts[0] !== bucketName) {
      return decodeURIComponent(parts.join("/"));
    }
    return decodeURIComponent(parts.slice(1).join("/"));
  } catch {
    return null;
  }
}

// Delete file from Google Cloud Storage using the URL
export async function deleteFileFromCloud({ fileUrl }: { fileUrl: string }) {
  if (!fileUrl) return;

  // Check if it's a GCS URL
  if (!fileUrl.includes("storage.googleapis.com")) return;

  const filePath = extractFilePathFromUrl(fileUrl);
  if (!filePath)
    throw new ApiError(
      404,
      "Invalid file URL. Could not extract GCS object path.",
    );

  try {
    await bucket.file(filePath).delete();
    return { success: true, key: filePath };
  } catch (error: any) {
    if (error?.code === 404) {
      return { success: false, message: "File not found" };
    }
    throw error;
  }
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

// Upload directly to GCS from buffer
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

  const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = path.extname(sanitizedName);
  const nameWithoutExt = sanitizedName.replace(/\.[^/.]+$/, "");
  const fileName = `${folder}/${Date.now()}_${nameWithoutExt}${ext}`;

  const blob = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on("error", (err) => {
      console.error("Error uploading file to GCS:", err);
      reject(err);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      resolve({
        Location: publicUrl,
        Key: fileName,
      });
    });

    blobStream.end(file.buffer);
  });
};

// Upload buffer directly to GCS (e.g. generated images, screenshots)
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

  const fileName = `${folder}/${Date.now()}_${crypto
    .randomBytes(6)
    .toString("hex")}.png`;

  const blob = bucket.file(fileName);

  return new Promise((resolve, reject) => {
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: "image/png",
      },
    });

    blobStream.on("error", (err) => reject(err));

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
      resolve({
        Location: publicUrl,
        Key: fileName,
      });
    });

    blobStream.end(buffer);
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
