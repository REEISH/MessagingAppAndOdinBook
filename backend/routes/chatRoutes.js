import express from "express";
import {
  getContacts,
  getChatHistory,
  createGroup,
  getUserGroups,
  uploadChatMedia,
} from "../controllers/chatController.js";
import { authenticate } from "../middleware/auth.js";
import { upload, validateMediaSize } from "../middleware/upload.js";

const router = express.Router();

router.use(authenticate);

router.get("/contacts", getContacts);
router.get("/history/:otherUserId", getChatHistory);
router.post("/groups", createGroup);
router.get("/groups", getUserGroups);
router.post(
  "/upload",
  upload.single("media"),
  validateMediaSize,
  uploadChatMedia,
);

export default router;
