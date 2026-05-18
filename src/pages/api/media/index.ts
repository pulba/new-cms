import type { APIRoute } from "astro";
import { db } from "@/db";
import { media } from "@/db/schema";
import { desc, sql, like } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  try {
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "30")));
    const search = url.searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = search ? like(media.name, `%${search}%`) : undefined;

    // Parallel: fetch items + count
    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(media)
        .where(conditions)
        .orderBy(desc(media.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(media)
        .where(conditions),
    ]);

    const total = countResult[0]?.count || 0;

    return new Response(JSON.stringify({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
