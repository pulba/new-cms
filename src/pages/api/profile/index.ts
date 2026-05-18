import type { APIRoute } from "astro";
import { db } from "@/db";
import { schoolProfile } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async () => {
  try {
    const allProfiles = await db.select().from(schoolProfile).limit(1);
    
    let profileData = {};
    if (allProfiles.length > 0) {
      // Map Drizzle result (camelCase or snake_case depending on schema definition)
      // Drizzle returns camelCase keys as defined in schema.ts
      const row = allProfiles[0];
      profileData = row;
    }

    return new Response(JSON.stringify(profileData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as Record<string, any>;
    
    // We expect the frontend to send camelCase keys that match our schema.ts
    // or we just pass the object directly to drizzle.
    
    // Filter out id just in case
    const { id, ...updateData } = body;

    const existing = await db.select().from(schoolProfile).limit(1);

    if (existing.length > 0) {
      await db
        .update(schoolProfile)
        .set(updateData)
        .where(eq(schoolProfile.id, existing[0].id));
    } else {
      await db.insert(schoolProfile).values(updateData as any);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
};
