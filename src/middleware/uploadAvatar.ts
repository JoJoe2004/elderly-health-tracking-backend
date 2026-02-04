import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (_req, file) => {
    const isAvatar = file.fieldname === "avatar";

    return {
      folder: isAvatar ? "avatars" : "uploads", // แยก folder ได้
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          width: 512,
          height: 512,
          crop: "limit",
          quality: "auto",
        },
      ],
    };
  },
});

export const uploadAvatar  = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },

  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files allowed"));
    } else {
      cb(null, true);
    }
  },
});
