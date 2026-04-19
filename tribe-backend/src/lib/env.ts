import { z } from 'zod';

const envSchema = z.object({
    DATABASE_URL: z.string().url({
        message: 'DATABASE_URL must be a valid connection URL (e.g. postgresql://user:pass@host:5432/db)',
    }),
    JWT_SECRET: z.string().min(1, {
        message: 'JWT_SECRET must be a non-empty string',
    }),
    SOCKET_PORT: z
        .string()
        .optional()
        .default('4000')
        .transform((val) => Number(val))
        .refine((val) => !isNaN(val) && val > 0 && val < 65536, {
            message: 'SOCKET_PORT must be a valid port number (1-65535)',
        }),

    // Cloudinary
    CLOUDINARY_CLOUD_NAME: z.string().min(1, {
        message: 'CLOUDINARY_CLOUD_NAME is required',
    }),
    CLOUDINARY_API_KEY: z.string().min(1, {
        message: 'CLOUDINARY_API_KEY is required',
    }),
    CLOUDINARY_API_SECRET: z.string().min(1, {
        message: 'CLOUDINARY_API_SECRET is required',
    }),
});

// Validate once at module load time — throws immediately on missing/invalid vars.
const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
    const issues = _parsed.error.issues
        .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');

    throw new Error(
        `\n\n[env] ❌ Missing or invalid environment variables:\n${issues}\n\nFix your .env file and restart the server.\n`,
    );
}

export const env = _parsed.data;
