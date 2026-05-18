import type { APIRoute } from "astro";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const allCategories = await db.select().from(categories);
    return new Response(JSON.stringify(allCategories), {
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
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return new Response("Name and slug are required", { status: 400 });
    }

    const result = await db.insert(categories).values({ name, slug }).returning();

    return new Response(JSON.stringify(result[0]), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE")) {
      return new Response("Slug sudah digunakan", { status: 409 });
    }
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
