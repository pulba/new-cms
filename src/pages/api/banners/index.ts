import type { APIRoute } from "astro";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { asc } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const allBanners = await db.select().from(banners).orderBy(asc(banners.sortOrder));
    return new Response(JSON.stringify(allBanners), {
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
    const { title, subtitle, description, imageUrl, primaryCtaText, primaryCtaHref, secondaryCtaText, secondaryCtaHref, isActive, sortOrder } = body;

    if (!title || !imageUrl) {
      return new Response("Title and Image URL are required", { status: 400 });
    }

    const result = await db.insert(banners).values({
      title,
      subtitle: subtitle || "",
      description: description || "",
      imageUrl,
      primaryCtaText: primaryCtaText || null,
      primaryCtaHref: primaryCtaHref || null,
      secondaryCtaText: secondaryCtaText || null,
      secondaryCtaHref: secondaryCtaHref || null,
      isActive: isActive ?? true,
      sortOrder: sortOrder || 0,
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
