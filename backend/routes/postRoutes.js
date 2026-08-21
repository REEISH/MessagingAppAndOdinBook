import express from "express";
import {
  createPost,
  getPublicPosts,
  getPostById,
  addComment,
} from "../controllers/postController.js";
import { authenticate } from "../middleware/auth.js";
import { upload, validateMediaSize } from "../middleware/upload.js";
import { toggleLike } from "../controllers/postController.js";

const router = express.Router();

router.use(authenticate);

router.post("/", upload.single("image"), validateMediaSize, createPost);
router.get("/", getPublicPosts);
router.get("/:id", getPostById);
router.post("/:id/comments", addComment);
router.post("/:id/like", toggleLike);

export default router;
