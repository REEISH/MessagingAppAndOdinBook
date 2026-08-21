import prisma from "../config/prisma.js";

const onlineUsers = new Map();

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register User (Link DB userId to Socket ID)
    socket.on("register", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    });

    // Join Group Rooms
    socket.on("join_group", (groupId) => {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
    });

    // Handle 1-on-1 Direct Messages
    socket.on(
      "send_direct_message",
      async ({ senderId, receiverId, content, mediaUrl, mediaType }) => {
        try {
          // Save message to database
          const message = await prisma.message.create({
            data: {
              senderId,
              receiverId,
              content,
              mediaUrl,
              mediaType: mediaType || "NONE",
            },
            include: {
              sender: { select: { id: true, name: true, profilePic: true } },
            },
          });

          // Emit to receiver if online
          const receiverSocketId = onlineUsers.get(receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("receive_message", message);
          }

          // Acknowledge sent message back to the sender
          socket.emit("message_sent", message);

          // Dummy Admin Auto-Reply Logic
          const admin = await prisma.user.findFirst({
            where: {
              name: {
                equals: "admin",
                mode: "insensitive",
              },
            },
          });
          if (admin && receiverId === admin.id) {
            setTimeout(async () => {
              const botReply = await prisma.message.create({
                data: {
                  senderId: admin.id,
                  receiverId: senderId,
                  content:
                    "Server Admin received your message. I am just a bot here for your rants!",
                  mediaType: "NONE",
                },
                include: {
                  sender: {
                    select: { id: true, name: true, profilePic: true },
                  },
                },
              });
              // Send bot reply back to the original sender
              socket.emit("receive_message", botReply);
            }, 1000); // 1-second delay for realism
          }
        } catch (error) {
          console.error("Error sending direct message:", error);
          socket.emit("message_error", { error: "Failed to send message" });
        }
      },
    );

    // Handle Group Messages
    socket.on(
      "send_group_message",
      async ({ senderId, groupId, content, mediaUrl, mediaType }) => {
        try {
          // Save group message to database
          const message = await prisma.message.create({
            data: {
              senderId,
              groupId,
              content,
              mediaUrl,
              mediaType: mediaType || "NONE",
            },
            include: {
              sender: { select: { id: true, name: true, profilePic: true } },
            },
          });

          // Broadcast to everyone in the group room
          io.to(groupId).emit("receive_group_message", message);
        } catch (error) {
          console.error("Error sending group message:", error);
          socket.emit("message_error", {
            error: "Failed to send group message",
          });
        }
      },
    );

    // Handle Disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
      // Remove socket from onlineUsers map
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });
}
