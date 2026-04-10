import type { VercelRequest } from "@vercel/node";

/**
 * Si RESOLVER_SECRET está definido, exige token por query ?token= o Authorization: Bearer.
 */
export function isAuthValid(req: VercelRequest): boolean {
  const secret = process.env.RESOLVER_SECRET?.trim();
  if (!secret) {
    return true;
  }

  const q = req.query;
  const tokenFromQuery =
    typeof q.token === "string"
      ? q.token
      : Array.isArray(q.token)
        ? q.token[0]
        : undefined;

  const auth = req.headers.authorization;
  let tokenFromHeader: string | undefined;
  if (typeof auth === "string" && auth.startsWith("Bearer ")) {
    tokenFromHeader = auth.slice("Bearer ".length).trim();
  }

  const provided = tokenFromQuery ?? tokenFromHeader;
  return provided === secret;
}
