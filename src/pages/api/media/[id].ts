import type { APIRoute } from "astro";
import { db } from "@/db";
import { media, posts, pages, banners, galleries, staff, osisMembers, users, schoolProfile, activityLogs } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { destroyFromCloudinary } from "../upload";
import { checkMediaOperationRateLimit } from "@/lib/ratelimit";

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id!);
    const now = new Date().toISOString();
    const authorId = locals.user?.id || null;
    const authorName = locals.user?.name || "Admin";
    const authorAvatar = locals.user?.photoUrl || null;

    // Rate limit check (session-based, cost=1 for delete)
    if (authorId) {
      const rl = await checkMediaOperationRateLimit(authorId, 1, "delete");
      if (!rl.allowed) return rl.response!;
    }

    // 1. Fetch media record
    const targetMediaRows = await db.select().from(media).where(eq(media.id, id)).limit(1);
    if (targetMediaRows.length === 0) {
      return new Response("Media not found", { status: 404 });
    }
    const targetMedia = targetMediaRows[0];
    const targetUrl = targetMedia.url;
    const targetPublicId = targetMedia.publicId;

    // 2. Full Usage Scanner (Dependency Map)
    const dependencies: { module: string, title: string }[] = [];

    const [
      postsUsage,
      pagesUsage,
      bannersUsage,
      galleriesUsage,
      staffUsage,
      osisUsage,
      usersUsage,
      profileUsage
    ] = await Promise.all([
      db.select({ id: posts.id, title: posts.title }).from(posts).where(eq(posts.featuredImage, targetUrl)),
      db.select({ id: pages.id, title: pages.title }).from(pages).where(eq(pages.featuredImage, targetUrl)),
      db.select({ id: banners.id, title: banners.title }).from(banners).where(eq(banners.imageUrl, targetUrl)),
      db.select({ id: galleries.id, title: galleries.altText }).from(galleries).where(eq(galleries.imageUrl, targetUrl)),
      db.select({ id: staff.id, title: staff.name }).from(staff).where(eq(staff.imageUrl, targetUrl)),
      db.select({ id: osisMembers.id, title: osisMembers.name }).from(osisMembers).where(eq(osisMembers.photo, targetUrl)),
      db.select({ id: users.id, title: users.email }).from(users).where(eq(users.photoUrl, targetUrl)),
      db.select().from(schoolProfile).where(
        or(
          eq(schoolProfile.schoolLogo, targetUrl),
          eq(schoolProfile.schoolFavicon, targetUrl),
          eq(schoolProfile.historyImage, targetUrl),
          eq(schoolProfile.profileHeroImage, targetUrl),
          eq(schoolProfile.principalImage, targetUrl)
        )
      ).limit(1)
    ]);

    postsUsage.forEach(r => dependencies.push({ module: "Berita", title: r.title }));
    pagesUsage.forEach(r => dependencies.push({ module: "Halaman", title: r.title }));
    bannersUsage.forEach(r => dependencies.push({ module: "Hero Banner", title: r.title }));
    galleriesUsage.forEach(r => dependencies.push({ module: "Galeri", title: r.title }));
    staffUsage.forEach(r => dependencies.push({ module: "Guru & Staf", title: r.title }));
    osisUsage.forEach(r => dependencies.push({ module: "OSIS", title: r.title }));
    usersUsage.forEach(r => dependencies.push({ module: "Pengguna", title: r.title }));
    if (profileUsage.length > 0) {
      dependencies.push({ module: "School Profile", title: "Pengaturan Website" });
    }

    // 3. Explainable Delete Conflict
    if (dependencies.length > 0) {
      // Activity Log: Blocked
      await db.insert(activityLogs).values({
        userId: authorId,
        userName: authorName,
        userAvatar: authorAvatar,
        action: `Gagal menghapus media "${targetMedia.name}" (sedang digunakan)`,
        moduleName: "Media",
        status: "Gagal",
        createdAt: now,
      }).catch(err => console.error("Activity log failed:", err));

      return new Response(JSON.stringify({
        error: "Gambar masih digunakan oleh modul lain.",
        dependencies
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. ORDER OF DESTRUCTION & STRICT DESTROY RESPONSE POLICY
    let isOrphanRecovered = false;

    if (targetPublicId) {
      const cloudinaryResult = await destroyFromCloudinary(targetPublicId);
      
      if (cloudinaryResult.result === "ok") {
        isOrphanRecovered = false; // Normal success
      } else if (cloudinaryResult.result === "not found") {
        isOrphanRecovered = true; // DB has it, Cloudinary doesn't
      } else {
        // any other response = abort
        throw new Error(`Cloudinary destroy failed: ${cloudinaryResult.result}`);
      }
    } else {
      // Legacy files without publicId
      isOrphanRecovered = true;
    }

    // 5. Delete from DB (Only runs if Cloudinary didn't throw)
    await db.delete(media).where(eq(media.id, id));

    // 6. Activity Log
    let actionMessage = `Menghapus media "${targetMedia.name}" dari storage`;
    let statusMessage: "Berhasil" | "Info" = "Berhasil";
    
    if (isOrphanRecovered) {
      actionMessage = `Membersihkan orphan media "${targetMedia.name}" dari database`;
      statusMessage = "Info";
    }

    await db.insert(activityLogs).values({
      userId: authorId,
      userName: authorName,
      userAvatar: authorAvatar,
      action: actionMessage,
      moduleName: "Media",
      status: statusMessage,
      createdAt: now,
    }).catch(err => console.error("Activity log failed:", err));

    return new Response(JSON.stringify({ success: true, isOrphanRecovered }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Media DELETE error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
