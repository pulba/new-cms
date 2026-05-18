import type { APIRoute } from "astro";
import { db } from "@/db";
import { galleries } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = Number(params.id);
    const body = await request.json();

    await db.update(galleries).set(body).where(eq(galleries.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to update", { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  try {
    const id = Number(params.id);
    await db.delete(galleries).where(eq(galleries.id, id));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Failed to delete", { status: 500 });
  }
};
