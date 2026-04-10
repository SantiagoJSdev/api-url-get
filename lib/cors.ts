import type { VercelRequest, VercelResponse } from "@vercel/node";

export function applyCors(
  req: VercelRequest,
  res: VercelResponse
): void {
  const origin =
    process.env.CORS_ORIGIN?.trim() || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, OPTIONS"
  );
  const reqHeaders = req.headers["access-control-request-headers"];
  res.setHeader(
    "Access-Control-Allow-Headers",
    typeof reqHeaders === "string" && reqHeaders
      ? reqHeaders
      : "Authorization, Content-Type"
  );
  res.setHeader("Access-Control-Max-Age", "86400");
}
