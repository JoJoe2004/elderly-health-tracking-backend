import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

/*
  ใช้สำหรับ "รูปยา"
  - add  : array()
  - edit : single()
*/

const storage = new CloudinaryStorage({
  cloudinary,

  params: async () => ({
    folder: "medicines",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      {
        width: 800,
        height: 800,
        crop: "limit",
        quality: "auto",
      },
    ],
  }),
});

export const uploadMedicine = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files allowed"));
    } else {
      cb(null, true);
    }
  },
});
