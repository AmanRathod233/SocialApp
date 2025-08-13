import path from "path";
import fs from "fs";
import { promisify } from "util";

const unlinkFile = promisify(fs.unlink);

/** Get userId from JWT token in request */
export const getUserIdFromReq = (req) => {
  if (!req.user || !req.user.id) {
    throw new Error("User not authenticated");
  }
  return req.user.id;
};

/** Prepare file path from local upload */
export const prepareFilePath = (req) => {
  if (!req.file) throw new Error("No file uploaded");
  return path.join(process.cwd(), req.file.path);
};

/** Delete local uploaded file */
export const cleanupFile = async (filePath) => {
  try {
    await unlinkFile(filePath);
  } catch (err) {
    console.error("Error deleting file:", err);
  }
};

/** Convert local file to public URL for Instagram upload */
export const uploadToPublicStorage = (req) => {
  if (!req.file) throw new Error("No file uploaded");
  return `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
};
