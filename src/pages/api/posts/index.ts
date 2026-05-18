import type { APIRoute } from "astro";
import { db } from "@/db";
import { posts, users, activityLogs } from "@/db/schema";
import { eq, like, and, desc, sql } from "drizzle-orm";

export const GET: APIRoute = async ({ url }) => {
  try {
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions = [];
    if (search) {
      conditions.push(like(posts.title, `%${search}%`));
    }
    if (status) {
      conditions.push(eq(posts.status, status as "draft" | "published" | "archived"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get posts with author info
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        status: posts.status,
        featuredImage: posts.featuredImage,
        tags: posts.tags,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        authorName: users.displayName,
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(whereClause)
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereClause);

    const total = countResult[0]?.count || 0;

    return new Response(
      JSON.stringify({
        data: allPosts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    if (!title || !slug) {
      return new Response("Title and slug are required", { status: 400 });
    }

    const now = new Date().toISOString();
    const authorId = locals.user?.id || null;

    const result = await db
      .insert(posts)
      .values({
        title,
        slug,
        content: content || null,
        excerpt: excerpt || null,
        status: postStatus || "draft",
        authorId,
        featuredImage: featuredImage || null,
        tags: tags || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    const authorName = locals.user?.name || "Admin";
    const authorAvatar = null;

    await db.insert(activityLogs).values({
      userId: authorId,
      userName: authorName,
      userAvatar: authorAvatar,
      action: `membuat berita "${title}"`,
      moduleName: "Berita",
      status: "Berhasil",
      createdAt: now,
    }).catch(err => console.error("Activity log failed:", err));

    return new Response(JSON.stringify(result[0]), {
      status: 201,
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
