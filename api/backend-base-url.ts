import type { VercelRequest, VercelResponse } from "@vercel/node";
import { isAuthValid } from "../lib/auth";
import { applyCors } from "../lib/cors";
import {
  getDbName,
  getMongoClient,
  getRuntimeConfigCollectionName,
} from "../lib/mongo";

const DOC_ID = "pos_backend_base_url";

function toIsoString(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString();
    }
    return value.trim();
  }
  return null;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  applyCors(req, res);

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    res.status(405).json({
      error: "Method not allowed",
      code: "METHOD_NOT_ALLOWED",
    });
    return;
  }

  if (!isAuthValid(req)) {
    res.status(401).json({
      error: "Invalid or missing authentication",
      code: "UNAUTHORIZED",
    });
    return;
  }

  try {
    const client = await getMongoClient();
    const db = client.db(getDbName());
    const coll = db.collection<{
      _id: string;
      baseUrl?: string;
      updatedAt?: Date | string;
    }>(getRuntimeConfigCollectionName());

    const doc = await coll.findOne({ _id: DOC_ID });

    const baseUrl =
      typeof doc?.baseUrl === "string" ? doc.baseUrl.trim() : "";

    if (!doc || !baseUrl) {
      res.status(404).json({
        error:
          "Backend base URL is not configured: document missing or baseUrl empty",
        code: "BACKEND_BASE_URL_NOT_FOUND",
      });
      return;
    }

    const updatedAt = toIsoString(doc.updatedAt);

    res.status(200).json({
      baseUrl,
      updatedAt: updatedAt ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error";
    const isConfig = message === "MONGODB_URI is not set";
    res.status(500).json({
      error: isConfig
        ? "Server is not configured (missing MONGODB_URI)"
        : "Database connection or internal error",
      code: isConfig ? "SERVER_MISCONFIGURED" : "INTERNAL_ERROR",
      ...(process.env.NODE_ENV === "development" ? { detail: message } : {}),
    });
  }
}
