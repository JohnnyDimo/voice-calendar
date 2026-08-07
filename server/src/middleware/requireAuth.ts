import type { NextFunction, Request, Response } from "express";
import { getUserById } from "../db.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const userId = req.session.userId;
  if (!userId) {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  const user = getUserById(userId);
  if (!user) {
    req.session.userId = undefined;
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  req.currentUser = user;
  next();
}
