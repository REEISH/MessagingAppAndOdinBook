import prisma from "../config/prisma.js";

export const getContacts = async (req, res) => {
  const userId = req.user.id;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        groupId: null,
      },
      select: { senderId: true, receiverId: true },
    });

    const contactIds = new Set();
    messages.forEach((msg) => {
      if (msg.senderId && msg.senderId !== userId) contactIds.add(msg.senderId);
      if (msg.receiverId && msg.receiverId !== userId)
        contactIds.add(msg.receiverId);
    });

    const adminUser = await prisma.user.findFirst({
      where: { name: { equals: "admin", mode: "insensitive" } },
    });
    if (adminUser) contactIds.add(adminUser.id);

    if (contactIds.size === 0) {
      return res.status(200).json([]);
    }

    const contacts = await prisma.user.findMany({
      where: { id: { in: Array.from(contactIds) } },
      select: { id: true, name: true, profilePic: true },
    });

    const sortedContacts = contacts.sort((a, b) => {
      if (a.name.toLowerCase() === "admin") return -1;
      if (b.name.toLowerCase() === "admin") return 1;
      return 0;
    });

    res.status(200).json(sortedContacts);
  } catch (error) {
    console.error("CRITICAL CONTACTS ERROR:", error);
    res.status(500).json({ error: "Failed to fetch contacts." });
  }
};

export const getChatHistory = async (req, res) => {
  const { otherUserId } = req.params;
  const userId = req.user.id;
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
};

export const createGroup = async (req, res) => {
  const { name, memberIds } = req.body;
  const userId = req.user.id;

  try {
    const priorMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        groupId: null,
      },
    });

    const validContactIds = new Set();
    priorMessages.forEach((m) => {
      validContactIds.add(m.senderId === userId ? m.receiverId : m.senderId);
    });

    const isValidGroup = memberIds.every((id) => validContactIds.has(id));
    if (!isValidGroup) {
      return res
        .status(400)
        .json({ error: "You can only add existing chat contacts to a group." });
    }

    const group = await prisma.group.create({
      data: {
        name,
        members: { connect: [...memberIds, userId].map((id) => ({ id })) },
      },
      include: { members: { select: { id: true, name: true } } },
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: "Failed to create group." });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { id: req.user.id } } },
    });
    res.status(200).json(groups);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch groups." });
  }
};

export const uploadChatMedia = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image provided." });
  res.status(200).json({ mediaUrl: req.file.path });
};
