import express from "express";
import {
  searchUsers,
  getUserProfile,
  getRecentMessagePreviews,
  followUser,
  uploadProfilePic,
  unfollowUser,
  getTopFollowers,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/auth.js";
import { upload, validateMediaSize } from "../middleware/upload.js";
import { getUserPosts } from "../controllers/userController.js";
const router = express.Router();

// Apply auth middleware to all user routes
router.use(authenticate);

router.get("/search", searchUsers);
router.get("/recent-messages", getRecentMessagePreviews);
router.get("/:id", getUserProfile);
router.post("/:id/follow", followUser);
router.get("/:id/posts", getUserPosts);
router.post("/:id/unfollow", unfollowUser);
router.get("/:id/top-followers", getTopFollowers);
router.get("/:id/profile", getUserProfile);
router.post(
  "/dp",
  upload.single("profilePic"),
  validateMediaSize,
  uploadProfilePic,
);

export default router;
