import { z, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';

/**
 * Parse and validate a plain object against a Zod schema.
 *
 * Returns a discriminated union:
 *   { ok: true,  data: T }             — validation passed
 *   { ok: false, response: NextResponse } — 400 JSON with field-level errors
 *
 * Usage in a route handler:
 *   const result = await parseBody(req, MySchema);
 *   if (!result.ok) return result.response;
 *   const { field } = result.data;
 */
export async function parseBody<T>(
    req: Request,
    schema: ZodSchema<T>,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
    let raw: unknown;
    try {
        raw = await req.json();
    } catch {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Invalid JSON body.' },
                { status: 400 },
            ),
        };
    }

    const result = schema.safeParse(raw);

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field:   issue.path.join('.'),
            message: issue.message,
        }));
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Validation failed.', errors },
                { status: 400 },
            ),
        };
    }

    return { ok: true, data: result.data };
}

// ─── Re-exported Zod primitives used by multiple routes ──────────────────────
export { z };
