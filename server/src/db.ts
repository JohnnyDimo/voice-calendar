import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(path.join(dataDir, "app.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expiry INTEGER,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

export interface UserRow {
  id: number;
  google_id: string;
  email: string;
  name: string;
  picture: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expiry: number | null;
}

export function upsertUser(profile: {
  googleId: string;
  email: string;
  name: string;
  picture: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiry: number | null;
}): UserRow {
  const existing = db
    .prepare<[string], UserRow>("SELECT * FROM users WHERE google_id = ?")
    .get(profile.googleId);

  if (existing) {
    // Google only returns a refresh_token on the first consent; keep the old one if a new one wasn't issued.
    const refreshToken = profile.refreshToken ?? existing.refresh_token;
    db.prepare(
      `UPDATE users
       SET email = ?, name = ?, picture = ?, access_token = ?, refresh_token = ?, token_expiry = ?, updated_at = unixepoch()
       WHERE id = ?`
    ).run(
      profile.email,
      profile.name,
      profile.picture,
      profile.accessToken,
      refreshToken,
      profile.tokenExpiry,
      existing.id
    );
    return db.prepare<[number], UserRow>("SELECT * FROM users WHERE id = ?").get(existing.id)!;
  }

  const result = db
    .prepare(
      `INSERT INTO users (google_id, email, name, picture, access_token, refresh_token, token_expiry)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      profile.googleId,
      profile.email,
      profile.name,
      profile.picture,
      profile.accessToken,
      profile.refreshToken,
      profile.tokenExpiry
    );

  return db
    .prepare<[number | bigint], UserRow>("SELECT * FROM users WHERE id = ?")
    .get(result.lastInsertRowid)!;
}

export function getUserById(id: number): UserRow | undefined {
  return db.prepare<[number], UserRow>("SELECT * FROM users WHERE id = ?").get(id);
}

export function updateUserTokens(
  id: number,
  tokens: { accessToken: string; refreshToken?: string | null; tokenExpiry: number | null }
): void {
  if (tokens.refreshToken) {
    db.prepare(
      `UPDATE users SET access_token = ?, refresh_token = ?, token_expiry = ?, updated_at = unixepoch() WHERE id = ?`
    ).run(tokens.accessToken, tokens.refreshToken, tokens.tokenExpiry, id);
  } else {
    db.prepare(
      `UPDATE users SET access_token = ?, token_expiry = ?, updated_at = unixepoch() WHERE id = ?`
    ).run(tokens.accessToken, tokens.tokenExpiry, id);
  }
}
