import type { APIRoute } from "astro";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { desc } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const allAnnouncements = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));

    return new Response(JSON.stringify(allAnnouncements), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, content, isActive, expiresAt } = body;

    if (!title || !content) {
      return new Response("Title and content are required", { status: 400 });
    }

    const now = new Date().toISOString();

    const result = await db.insert(announcements).values({
      title,
      content,
      isActive: isActive ?? true,
      createdAt: now,
      expiresAt: expiresAt || null,
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
