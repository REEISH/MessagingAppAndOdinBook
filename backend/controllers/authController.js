import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

export const signup = async (req, res) => {
  const { name, password } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({ where: { name } });
    if (existingUser)
      return res.status(400).json({ error: "Name already taken." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, password: hashedPassword },
    });

    const token = jwt.sign(
      { id: user.id, name: user.name },
      process.env.JWT_SECRET,
    );
    res.status(201).json({ token, user: { id: user.id, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: "Signup failed." });
  }
};

export const signin = async (req, res) => {
  const { name, password } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { name } });
    if (!user) return res.status(400).json({ error: "Invalid credentials." });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { id: user.id, name: user.name },
      process.env.JWT_SECRET,
    );
    res
      .status(200)
      .json({
        token,
        user: { id: user.id, name: user.name, profilePic: user.profilePic },
      });
  } catch (error) {
    res.status(500).json({ error: "Signin failed." });
  }
};
