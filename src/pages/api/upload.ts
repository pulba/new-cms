import type { APIRoute } from "astro";
import { db } from "@/db";
import { media } from "@/db/schema";
import { checkMediaOperationRateLimit, getUploadCost } from "@/lib/ratelimit";

/**
 * Cloudinary upload via REST API (no SDK — Workers compatible).
 * Uses fetch() only, zero Node.js built-ins.
 */
async function uploadToCloudinary(
  dataUri: string,
  folder: string
): Promise<{
  secure_url: string;
  public_id: string;
  resource_type: string;
  bytes: number;
  width: number;
  height: number;
}> {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  // Generate signature
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  
  // HMAC-SHA1 signature using Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiSecret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(paramsToSign));
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("folder", folder);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

/**
 * Cloudinary destroy via REST API (no SDK).
 */
async function destroyFromCloudinary(publicId: string): Promise<{ result: string }> {
  const cloudName = import.meta.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = import.meta.env.CLOUDINARY_API_KEY;
  const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(apiSecret),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(paramsToSign));
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  const formData = new FormData();
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary destroy failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

// Re-export for use in media/[id].ts
export { destroyFromCloudinary };

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
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary via REST API
    const result = await uploadToCloudinary(dataUri, "school-cms");
    
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
      destroyFromCloudinary(uploadedPublicId).catch((err) => {
        console.error(`[Compensating Action Failed] Orphan file left in Cloudinary: ${uploadedPublicId}`, err);
      });
    }

    return new Response("Upload failed", { status: 500 });
  }
};
