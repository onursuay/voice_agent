import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "ai-agent-santral-secret-key-2025";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

// In-memory user store (production'da veritabanı kullanılacak)
const users: User[] = [];

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function generateToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function createUser(name: string, email: string, hashedPassword: string): User {
  const user: User = {
    id: crypto.randomUUID(),
    name,
    email,
    password: hashedPassword,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  return user;
}
