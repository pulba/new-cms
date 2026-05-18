import type { APIRoute } from "astro";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    const body = await request.json();
    const { title, subtitle, description, imageUrl, primaryCtaText, primaryCtaHref, secondaryCtaText, secondaryCtaHref, isActive, sortOrder } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (description !== undefined) updateData.description = description;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (primaryCtaText !== undefined) updateData.primaryCtaText = primaryCtaText || null;
    if (primaryCtaHref !== undefined) updateData.primaryCtaHref = primaryCtaHref || null;
    if (secondaryCtaText !== undefined) updateData.secondaryCtaText = secondaryCtaText || null;
    if (secondaryCtaHref !== undefined) updateData.secondaryCtaHref = secondaryCtaHref || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    if (Object.keys(updateData).length === 0) {
      return new Response("No fields to update", { status: 400 });
    }

    const result = await db
      .update(banners)
      .set(updateData)
      .where(eq(banners.id, id))
      .returning();

    if (result.length === 0) {
      return new Response("Banner not found", { status: 404 });
    }

    return new Response(JSON.stringify(result[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);

    const result = await db
      .delete(banners)
      .where(eq(banners.id, id))
      .returning();

    if (result.length === 0) {
      return new Response("Banner not found", { status: 404 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
