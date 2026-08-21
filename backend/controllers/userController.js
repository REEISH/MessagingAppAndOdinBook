import prisma from "../config/prisma.js";

export const getUserPosts = async (req, res) => {
  const { id } = req.params;
  try {
    const posts = await prisma.post.findMany({
      where: { authorId: id },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, profilePic: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user posts." });
  }
};

// Search users by name (Case-Insensitive)
export const searchUsers = async (req, res) => {
  const { query } = req.query;
  try {
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query || "",
          mode: "insensitive", // PostgreSQL case-insensitive search
        },
      },
      select: { id: true, name: true, profilePic: true },
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to search users." });
  }
};

// Get user profile with stats (Posts, Follows, Likes, Comments)
export const getUserProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { likes: true, comments: true } } },
        },
        followers: {
          include: {
            follower: { select: { id: true, name: true, profilePic: true } },
          },
        },
        following: {
          include: {
            following: { select: { id: true, name: true, profilePic: true } },
          },
        },
        _count: {
          select: { posts: true, comments: true, likes: true },
        },
      },
    });

    if (!user) return res.status(404).json({ error: "User not found." });

    // Format stats for the frontend
    const stats = {
      joinedAt: user.createdAt,
      totalPosts: user._count.posts,
      totalComments: user._count.comments,
      totalLikes: user._count.likes,
      totalFollowers: user.followers.length,
      totalFollowing: user.following.length,
    };

    // Remove sensitive data before sending
    delete user.password;

    res.status(200).json({ user, stats });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
};

// Get the last 5 recent messages preview (max 20 chars)
export const getRecentMessagePreviews = async (req, res) => {
  const userId = req.user.id;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        groupId: null, // Exclude group messages for this specific list, or remove this line to include them
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { sender: { select: { id: true, name: true } } },
    });

    const previews = messages.map((m) => ({
      id: m.id,
      sender: m.sender.name,
      preview: m.content ? m.content.substring(0, 20) : "[Media Attachment]",
      createdAt: m.createdAt,
      isSender: m.senderId === userId,
    }));

    res.status(200).json(previews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch message previews." });
  }
};

// Follow a user
export const followUser = async (req, res) => {
  const { id: followingId } = req.params;
  const followerId = req.user.id;

  if (followingId === followerId) {
    return res.status(400).json({ error: "You cannot follow yourself." });
  }

  try {
    const follow = await prisma.follow.create({
      data: { followerId, followingId },
    });
    res.status(201).json({ message: "User followed successfully.", follow });
  } catch (error) {
    // Check for unique constraint violation (already following)
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ error: "You are already following this user." });
    }
    res.status(500).json({ error: "Failed to follow user." });
  }
};

// Upload or Update Profile Picture (DP)
export const uploadProfilePic = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided." });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePic: req.file.path }, // The Cloudinary URL from the middleware
      select: { id: true, name: true, profilePic: true },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("DATABASE UPLOAD ERROR:", error);
    res.status(500).json({ error: "Failed to upload profile picture." });
  }
};

export const unfollowUser = async (req, res) => {
  const { id: followingId } = req.params;
  const followerId = req.user.id;

  try {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
    res.status(200).json({ message: "User unfollowed successfully." });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(400)
        .json({ error: "You are not following this user." });
    }
    res.status(500).json({ error: "Failed to unfollow user." });
  }
};

// Get top 10 followers sorted by their follower count
export const getTopFollowers = async (req, res) => {
  const { id } = req.params;
  try {
    const topFollowers = await prisma.follow.findMany({
      where: { followingId: id }, 
      take: 10,
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            profilePic: true,
            _count: { select: { followers: true } }, 
          },
        },
      },
      orderBy: {
        follower: {
          followers: {
            _count: "desc", 
          },
        },
      },
    });

    const formattedFollowers = topFollowers.map((f) => ({
      id: f.follower.id,
      name: f.follower.name,
      profilePic: f.follower.profilePic,
      followerCount: f.follower._count.followers,
    }));

    res.status(200).json(formattedFollowers);
  } catch (error) {
    console.error("Failed to fetch top followers:", error);
    res.status(500).json({ error: "Failed to fetch followers list." });
  }
};
