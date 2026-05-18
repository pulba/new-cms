import type { APIRoute } from "astro";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/db";
import { media } from "@/db/schema";
import { checkMediaOperationRateLimit, getUploadCost } from "@/lib/ratelimit";

cloudinary.config({
  cloud_name: import.meta.env.CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.CLOUDINARY_API_KEY,
  api_secret: import.meta.env.CLOUDINARY_API_SECRET,
});

export const POST: APIRoute = async ({ request, locals }) => {
  let uploadedPublicId: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("No file provided", { status: 400 });
    }

    // Rate limit check (session-based, weighted by file size)
    const userId = locals.user?.id;
    if (userId) {
      const cost = getUploadCost(file.size);
      const rl = await checkMediaOperationRateLimit(userId, cost, "upload");
      if (!rl.allowed) return rl.response!;
    }

    // Convert file to base64 data URI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: "school-cms",
      resource_type: "auto",
    });
    
    uploadedPublicId = result.public_id;

    // Save to database
    const now = new Date().toISOString();
    const authorId = locals.user?.id || null;

    const dbMedia = await db.insert(media).values({
      name: file.name,
      url: result.secure_url,
      publicId: result.public_id,
      type: result.resource_type,
      size: result.bytes,
      uploadedBy: authorId,
      createdAt: now,
    }).returning();

    return new Response(
      JSON.stringify({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        id: dbMedia[0].id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Upload error:", error);
    
    // Compensating Action: Cleanup orphan file in Cloudinary if DB insert fails
    if (uploadedPublicId) {
      console.log(`[Compensating Action] Rolling back Cloudinary upload: ${uploadedPublicId}`);
      // Fire and forget (non-blocking)
      cloudinary.uploader.destroy(uploadedPublicId).catch((err) => {
        console.error(`[Compensating Action Failed] Orphan file left in Cloudinary: ${uploadedPublicId}`, err);
      });
    }

    return new Response("Upload failed", { status: 500 });
  }
};
