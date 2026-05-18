import type { APIRoute } from "astro";
import { db } from "@/db";
import { osisMembers } from "@/db/schema";

export const GET: APIRoute = async () => {
  try {
    const allOsis = await db.select().from(osisMembers);
    return new Response(JSON.stringify(allOsis), {
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
    const { name, position, photo, description } = body;

    if (!name) {
      return new Response("Nama wajib diisi", { status: 400 });
    }

    const result = await db.insert(osisMembers).values({
      name,
      position: position || null,
      photo: photo || null,
      description: description || null,
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
