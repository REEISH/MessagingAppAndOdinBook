import prisma from "../config/prisma.js";

export const toggleLike = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  try {
    // Check if the user has already liked this post using the compound unique constraint
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // If the like exists, delete it (Unlike)
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return res.status(200).json({ message: "Post unliked successfully." });
    } else {
      // If the like doesn't exist, create it (Like)
      const newLike = await prisma.like.create({
        data: {
          postId,
          userId,
        },
      });
      return res
        .status(201)
        .json({ message: "Post liked successfully.", like: newLike });
    }
  } catch (error) {
    console.error("Like Error:", error);
    res.status(500).json({ error: "Failed to toggle like." });
  }
};

export const createPost = async (req, res) => {
  const { content } = req.body;
  const authorId = req.user.id;

  let mediaUrl = null;
  let mediaType = "NONE";

  if (req.file) {
    mediaUrl = req.file.path; // Cloudinary URL
    mediaType = req.file.mimetype.startsWith("audio/") ? "AUDIO" : "IMAGE";
  }

  try {
    const post = await prisma.post.create({
      data: { content, mediaUrl, mediaType, authorId },
    });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to create post." });
  }
};

export const getPublicPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, profilePic: true } },
        _count: { select: { comments: true, likes: true } },
        comments: { include: { author: { select: { name: true } } } }, 
      },
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch posts." });
  }
};

export const getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, profilePic: true } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { likes: true } },
      },
    });
    if (!post) return res.status(404).json({ error: "Post not found." });
    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch post." });
  }
};

export const addComment = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  try {
    const comment = await prisma.comment.create({
      data: { content, postId: id, authorId: req.user.id },
      include: { author: { select: { name: true } } },
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: "Failed to add comment." });
  }
};
