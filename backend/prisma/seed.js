import { createRequire } from "module";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const require = createRequire(import.meta.url);
const { PrismaClient } = require("../node_modules/.prisma/client/index.js");
const connectionString = process.env.DATABASE_URL;
console.log(connectionString);
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Complete the function given the schema
  await prisma.message.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // 1. Seed Users (including the Server Admin dummy user)
  const admin = await prisma.user.create({
    data: {
      name: "Admin",
      password: "admin_hashed_password",
      profilePic:
        "https://res.cloudinary.com/demo/image/upload/admin_avatar.png",
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: "alice",
      password: "alice_hashed_password",
      profilePic: "https://res.cloudinary.com/demo/image/upload/alice.jpg",
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: "bob",
      password: "bob_hashed_password",
      profilePic: "https://res.cloudinary.com/demo/image/upload/bob.jpg",
    },
  });

  // 2. Seed Follow Relationship
  await prisma.follow.create({
    data: {
      followerId: bob.id,
      followingId: alice.id,
    },
  });

  // 3. Seed Posts (Text, Image, and Audio)
  const textPost = await prisma.post.create({
    data: {
      content:
        "Welcome to my profile! This is my first text post under 500 chars.",
      mediaType: "NONE",
      authorId: alice.id,
    },
  });

  const imagePost = await prisma.post.create({
    data: {
      content: "Check out this picture!",
      mediaUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      mediaType: "IMAGE",
      authorId: alice.id,
    },
  });

  // 4. Seed Comments and Likes
  await prisma.comment.create({
    data: {
      content: "Awesome post!",
      postId: textPost.id,
      authorId: bob.id,
    },
  });

  await prisma.like.create({
    data: {
      postId: textPost.id,
      userId: bob.id,
    },
  });

  // 5. Seed Direct 1-on-1 Messages (Alice venting to the Admin dummy bot)
  await prisma.message.create({
    data: {
      content: "Hello Admin, just venting my thoughts here.",
      mediaType: "NONE",
      senderId: alice.id,
      receiverId: admin.id,
    },
  });

  await prisma.message.create({
    data: {
      content:
        "Hey Alice, this is the server bot. I have received your message!",
      mediaType: "NONE",
      senderId: admin.id,
      receiverId: alice.id,
    },
  });

  // Direct Audio Message between Alice and Bob
  await prisma.message.create({
    data: {
      mediaUrl: "https://res.cloudinary.com/demo/video/upload/audio_sample.mp3",
      mediaType: "AUDIO",
      senderId: bob.id,
      receiverId: alice.id,
    },
  });

  // 6. Seed Group Chat with Known Contacts
  const group = await prisma.group.create({
    data: {
      name: "Developers Lounge",
      members: {
        connect: [{ id: alice.id }, { id: bob.id }],
      },
    },
  });

  await prisma.message.create({
    data: {
      content: "Welcome to the group chat!",
      mediaType: "NONE",
      senderId: alice.id,
      groupId: group.id,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
