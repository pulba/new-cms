import type { APIRoute } from "astro";
import { db } from "@/db";
import { osisMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const id = parseInt(params.id!);
    const body = await request.json();
    const { name, position, photo, description } = body;

    const result = await db
      .update(osisMembers)
      .set({
        name,
        position: position || null,
        photo: photo || null,
        description: description || null,
      })
      .where(eq(osisMembers.id, id))
      .returning();

    if (result.length === 0) {
      return new Response("OSIS member not found", { status: 404 });
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
      .delete(osisMembers)
      .where(eq(osisMembers.id, id))
      .returning();

    if (result.length === 0) {
      return new Response("OSIS member not found", { status: 404 });
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
