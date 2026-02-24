import { config } from "dotenv";
import { z } from "zod";

config({ path: ".env" });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:8080"),
  PUBLIC_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().optional(),
  CORS_ORIGINS: z.string().optional(),

  RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required"),
  RESEND_FROM_EMAIL: z.string().email("RESEND_FROM_EMAIL must be a valid email"),

  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("store-assets"),

  CLOUDINARY_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),

  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  PINECONE_VECTOR_DIM: z.coerce.number().int().positive().default(256),
  PINECONE_NAMESPACE_PREFIX: z.string().default("tenant"),

  STORE_URL_PROTOCOL: z.enum(["http", "https"]).default("http"),
  STORE_BASE_DOMAIN: z.string().default("lvh.me"),
  STORE_URL_PORT: z.string().default("3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${message}`);
}

export const env = parsed.data;

export type AppEnv = typeof env;
