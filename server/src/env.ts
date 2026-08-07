import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-me",
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  googleClientId: required("GOOGLE_CLIENT_ID"),
  googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
  googleRedirectUri: required("GOOGLE_REDIRECT_URI"),
};
