import type { APIRoute } from "astro";
import { SESSION_COOKIE_NAME } from "@/lib/auth-server";

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
