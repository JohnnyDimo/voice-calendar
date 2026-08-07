import express from "express";
import cors from "cors";
import session from "express-session";
import { env } from "./env.js";
import "./db.js";
import { parseRouter } from "./routes/parse.js";
import { authRouter } from "./routes/auth.js";
import { calendarRouter } from "./routes/calendar.js";

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(
  session({
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/api", parseRouter);
app.use("/api", calendarRouter);

app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
