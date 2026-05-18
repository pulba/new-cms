import type { APIRoute } from "astro";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const allStaff = await db.select().from(staff);
    return new Response(JSON.stringify(allStaff), {
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
    const { name, nip, position, photo, description } = body;

    if (!name) {
      return new Response("Nama wajib diisi", { status: 400 });
    }

    const result = await db.insert(staff).values({
      name,
      nip: nip || null,
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
