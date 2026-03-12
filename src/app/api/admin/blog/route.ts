import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** GET /api/admin/blog — list all posts (admin view, includes unpublished) */
export async function GET() {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .select("id, title, slug, excerpt, author, published, published_at, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/** POST /api/admin/blog — create a new post */
export async function POST(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, slug, excerpt, body: postBody, author, published } = body as {
    title: string;
    slug: string;
    excerpt?: string;
    body: string;
    author?: string;
    published?: boolean;
  };

  if (!title?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      title: title.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""),
      excerpt: excerpt?.trim() || null,
      body: postBody || "",
      author: author?.trim() || null,
      published: !!published,
      published_at: published ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/admin/blog — update an existing post */
export async function PATCH(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { id, ...updates } = body as { id: string; [key: string]: unknown };

  if (!id) return NextResponse.json({ error: "Post id is required" }, { status: 400 });

  // If toggling to published and no published_at yet, set it
  if (updates.published === true) {
    updates.published_at = new Date().toISOString();
  }

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").update(updates).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/blog — delete a post */
export async function DELETE(request: NextRequest) {
  const user = await requireAuth();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = (await request.json()) as { id: string };
  if (!id) return NextResponse.json({ error: "Post id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("blog_posts").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
