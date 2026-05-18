import type { APIRoute } from "astro";
import { db } from "@/db";
import { posts, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET: APIRoute = async ({ params }) => {
  try {
    const id = parseInt(params.id!);
    const post = await db.select().from(posts).where(eq(posts.id, id)).limit(1);

    if (post.length === 0) {
      return new Response("Post not found", { status: 404 });
    }

    return new Response(JSON.stringify(post[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const id = parseInt(params.id!);
    const body = await request.json();

    const {
      title,
      slug,
      content,
      excerpt,
      status: postStatus,
      featuredImage,
      tags,
      metaDescription,
      metaKeywords,
    } = body;

    const now = new Date().toISOString();

    const result = await db
      .update(posts)
      .set({
        title,
        slug,
        content: content || null,
        excerpt: excerpt || null,
        status: postStatus || "draft",
        featuredImage: featuredImage || null,
        tags: tags || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        updatedAt: now,
      })
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      return new Response("Post not found", { status: 404 });
    }

    const authorId = locals.user?.id || null;
    const authorName = locals.user?.name || "Admin";
    const authorAvatar = null;

    await db.insert(activityLogs).values({
      userId: authorId,
      userName: authorName,
      userAvatar: authorAvatar,
      action: `mengedit berita "${title}"`,
      moduleName: "Berita",
      status: "Berhasil",
      createdAt: now,
    }).catch(err => console.error("Activity log failed:", err));

    return new Response(JSON.stringify(result[0]), {
      status: 200,
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

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const id = parseInt(params.id!);

    const result = await db
      .delete(posts)
      .where(eq(posts.id, id))
      .returning();

    if (result.length === 0) {
      return new Response("Post not found", { status: 404 });
    }

    const authorId = locals.user?.id || null;
    const authorName = locals.user?.name || "Admin";
    const authorAvatar = null;

    await db.insert(activityLogs).values({
      userId: authorId,
      userName: authorName,
      userAvatar: authorAvatar,
      action: `menghapus berita "${result[0].title}"`,
      moduleName: "Berita",
      status: "Berhasil",
      createdAt: new Date().toISOString(),
    }).catch(err => console.error("Activity log failed:", err));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
