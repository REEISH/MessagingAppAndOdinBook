// config/prisma.js
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client'; 
import dotenv from 'dotenv';

dotenv.config();

// Instantiate the adapter with your Neon PostgreSQL connection string
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Pass the adapter to the PrismaClient constructor
const prisma = new PrismaClient({ adapter });

export default prisma;