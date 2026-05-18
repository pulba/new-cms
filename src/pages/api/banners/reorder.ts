import type { APIRoute } from "astro";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body: { items: { id: number; sortOrder: number }[] } = await request.json();

    await db.transaction(async (tx) => {
      for (const item of body.items) {
        await tx.update(banners).set({ sortOrder: item.sortOrder }).where(eq(banners.id, item.id));
      }
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to reorder", { status: 500 });
  }
};
