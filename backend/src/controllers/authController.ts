import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/User";
import "dotenv/config";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.JWT_SECRET) {
  console.error(
    "CRITICAL: GOOGLE_CLIENT_ID or JWT_SECRET is missing from .env",
  );
  process.exit(1);
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Google ID token is required" });
    return;
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      res.status(400).json({ error: "Invalid Google token payload" });
      return;
    }

    const { sub: googleId, email, name } = payload;

    let user = await User.findOne({ googleId });

    if (!user) {
      user = await User.create({
        googleId,
        email,
        name: name || "User",
        plan: "free",
      });
    }

    const jwtToken = jwt.sign(
      { userId: user._id, plan: user.plan },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" },
    );

    res.status(200).json({ token: jwtToken, user });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ error: "Authentication failed" });
  }
};
