import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isAudio = file.mimetype.startsWith("audio");
    return {
      folder: isAudio ? "social_app/audio" : "social_app/images",
      resource_type: isAudio ? "video" : "image", // Cloudinary processes audio under 'video'
    };
  },
});

const fileFilter = (req, file, cb) => {
  const isImage = file.mimetype.startsWith("image/");
  const isAudio = file.mimetype.startsWith("audio/");

  if (!isImage && !isAudio) {
    return cb(
      new Error("Invalid file type. Only images and audio allowed."),
      false,
    );
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 512 * 1024 }, // 512 KB max for images
});

export const validateMediaSize = (req, res, next) => {
  if (req.file && req.file.mimetype.startsWith("audio/")) {
    if (req.file.size > 256 * 1024) {
      return res
        .status(400)
        .json({ error: "Audio files cannot exceed 256 KB." });
    }
  }
  next();
};
