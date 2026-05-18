import type { APIRoute } from "astro";
import { db } from "@/db";
import { schoolStats } from "@/db/schema";
import { asc } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const stats = await db.select().from(schoolStats).orderBy(asc(schoolStats.sortOrder));
    
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
