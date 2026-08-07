import { Router } from "express";
import { env } from "../env.js";
import { getUserById, upsertUser } from "../db.js";
import { exchangeCodeForProfile, getGoogleAuthUrl } from "../services/googleCalendar.js";

export const authRouter = Router();

authRouter.get("/google", (_req, res) => {
  res.redirect(getGoogleAuthUrl());
});

authRouter.get("/google/callback", async (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    res.status(400).send("Missing authorization code");
    return;
  }

  try {
    const profile = await exchangeCodeForProfile(code);
    const user = upsertUser(profile);
    req.session.userId = user.id;
    res.redirect(env.clientOrigin);
  } catch (err) {
    console.error("Google OAuth callback failed:", err);
    res.status(502).send("Google sign-in failed");
  }
});

authRouter.get("/me", (req, res) => {
  const user = req.session.userId ? getUserById(req.session.userId) : undefined;
  if (!user) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }
  res.json({ id: user.id, email: user.email, name: user.name, picture: user.picture });
});

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.status(204).end();
  });
});

authRouter.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect(env.clientOrigin);
  });
});
