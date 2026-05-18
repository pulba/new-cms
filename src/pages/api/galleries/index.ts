import type { APIRoute } from "astro";
import { db } from "@/db";
import { galleries } from "@/db/schema";
import { asc } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const all = await db.select().from(galleries).orderBy(asc(galleries.sortOrder));
    return new Response(JSON.stringify(all), {
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
    const result = await db.insert(galleries).values({
      imageUrl: body.imageUrl,
      altText: body.altText || "",
      category: body.category || "Umum",
      span: body.span || "small",
      sortOrder: body.sortOrder || 0,
      isFeatured: body.isFeatured || false,
    }).returning();

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to create gallery item", { status: 500 });
  }
};
