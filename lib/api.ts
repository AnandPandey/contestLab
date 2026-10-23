import { connection, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/app/generated/prisma/client";

/** Max accepted JSON body size. Large enough for statements and test data. */
export const MAX_BODY_BYTES = 2 * 1024 * 1024;

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what: string) =>
  new ApiError(404, "not_found", `${what} not found`);

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

function errorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return json(
      { error: { code: err.code, message: err.message, details: err.details } },
      err.status,
    );
  }
  if (err instanceof z.ZodError) {
    return json(
      {
        error: {
          code: "validation_error",
          message: "Request validation failed",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      400,
    );
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return json({ error: { code: "not_found", message: "Record not found" } }, 404);
      case "P2002":
        return json(
          { error: { code: "conflict", message: "A record with this unique value already exists" } },
          409,
        );
      case "P2003":
        return json(
          { error: { code: "invalid_reference", message: "Referenced record does not exist" } },
          400,
        );
    }
  }
  console.error("[api] unhandled error", err);
  return json({ error: { code: "internal_error", message: "Internal server error" } }, 500);
}

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

/**
 * Wraps a route handler so thrown ApiError/ZodError/Prisma errors become JSON
 * responses. Also opts the handler out of prerendering (cacheComponents is on),
 * since every API route reads live database state.
 */
export function route<C = unknown>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    await connection();
    try {
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Reads and validates a JSON body, enforcing MAX_BODY_BYTES. */
export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    throw new ApiError(413, "payload_too_large", `Body exceeds ${MAX_BODY_BYTES} bytes`);
  }
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) {
    throw new ApiError(413, "payload_too_large", `Body exceeds ${MAX_BODY_BYTES} bytes`);
  }
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON");
  }
  return schema.parse(data);
}

/** Validates URL search params against a schema (repeated keys become arrays). */
export function parseQuery<S extends z.ZodType>(req: Request, schema: S): z.infer<S> {
  const params = new URL(req.url).searchParams;
  const obj: Record<string, string> = {};
  for (const [k, v] of params) obj[k] = v;
  return schema.parse(obj);
}

export function slugify(text: string) {
  return (
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

/** Returns `base`, or `base-2`, `base-3`, ... whichever is not taken. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  let slug = base;
  for (let n = 2; await exists(slug); n++) slug = `${base}-${n}`;
  return slug;
}
