import type { APIRoute } from "astro";
import { db } from "@/db";
import { inbox } from "@/db/schema";
import { desc } from "drizzle-orm";
import { checkInboxRateLimit } from "@/lib/ratelimit";

export const GET: APIRoute = async () => {
  try {
    const allMessages = await db.select().from(inbox).orderBy(desc(inbox.createdAt));
    return new Response(JSON.stringify(allMessages), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

// POST is mainly for the public site to submit messages
export const POST: APIRoute = async ({ request }) => {
  // Rate limit check (IP-based, 3 req / 10 min)
  const rl = await checkInboxRateLimit(request);
  if (!rl.allowed) return rl.response!;

  try {
    const body = await request.json();
    const { name, email, subject, phone, message } = body;

    if (!name || !email || !subject || !message) {
      return new Response("Name, email, subject, and message are required", { status: 400 });
    }

    const now = new Date().toISOString();

    const result = await db.insert(inbox).values({
      name,
      email,
      phone: phone || null,
      subject,
      message,
      isRead: false,
      isArchived: false,
      createdAt: now,
    }).returning();

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
