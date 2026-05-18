import React, { useState, useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
  Minus,
  Save,
  Send,
  ArrowLeft,
  Loader2,
  Settings,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slugify";
import { CategoryManager } from "./CategoryManager";

interface PostEditorProps {
  postId?: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const postSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  excerpt: z.string().optional(),
  tags: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

export function PostEditor({ postId }: PostEditorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("draft");
  const [featuredImage, setFeaturedImage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PostFormData>({
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      tags: "",
      metaDescription: "",
      metaKeywords: "",
    },
  });

  const title = watch("title");

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && title) {
      setValue("slug", slugify(title));
    }
  }, [title, autoSlug, setValue]);

  // Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[400px] focus:outline-none px-4 py-3",
      },
    },
  });

  // Fetch categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then(setCategories)
      .catch(() => { });
  }, [categoryManagerOpen]);

  // Load existing post data if editing
  useEffect(() => {
    if (!postId) return;
    setIsLoading(true);
    fetch(`/api/posts/${postId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Post not found");
        return res.json();
      })
      .then((data) => {
        setValue("title", data.title || "");
        setValue("slug", data.slug || "");
        setValue("excerpt", data.excerpt || "");
        setValue("tags", data.tags || "");
        setValue("metaDescription", data.metaDescription || data.meta_description || "");
        setValue("metaKeywords", data.metaKeywords || data.meta_keywords || "");
        setStatus(data.status || "draft");
        setFeaturedImage(data.featuredImage || data.featured_image || "");
        setAutoSlug(false);
        if (editor && (data.content)) {
          editor.commands.setContent(data.content);
        }
      })
      .catch(() => toast.error("Gagal memuat berita"))
      .finally(() => setIsLoading(false));
  }, [postId, editor]);

  const onSubmit = useCallback(
    async (data: PostFormData, publishStatus?: string) => {
      setIsSaving(true);
      const finalStatus = publishStatus || status;

      const body = {
        ...data,
        content: editor?.getHTML() || "",
        status: finalStatus,
        featuredImage: featuredImage || null,
      };

      try {
        const url = postId ? `/api/posts/${postId}` : "/api/posts";
        const method = postId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (res.status === 409) {
          toast.error("Slug sudah digunakan, pilih slug lain");
          return;
        }

        if (!res.ok) throw new Error("Failed to save");

        const savedPost = await res.json();
        toast.success(
          finalStatus === "published"
            ? "Berita berhasil dipublish!"
            : "Berita berhasil disimpan!"
        );

        // Redirect to edit page if new post
        if (!postId && savedPost.id) {
          window.location.href = `/admin/posts/${savedPost.id}`;
        }
      } catch {
        toast.error("Gagal menyimpan berita");
      } finally {
        setIsSaving(false);
      }
    },
    [editor, status, featuredImage, postId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <a href="/admin/posts">
              <ArrowLeft className="h-4 w-4" />
            </a>
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {postId ? "Edit Berita" : "Buat Berita Baru"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={
                  status === "published"
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }
              >
                {status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSubmit((data) => onSubmit(data, "draft"))}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Simpan Draft
          </Button>
          <Button
            onClick={handleSubmit((data) => onSubmit(data, "published"))}
            disabled={isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Publish
          </Button>
        </div>
      </div>

      <Separator />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Main content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Berita</Label>
            <Input
              id="title"
              placeholder="Masukkan judul berita..."
              className="text-lg font-semibold"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="slug">Slug (URL)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setAutoSlug(!autoSlug)}
              >
                {autoSlug ? "Edit Manual" : "Auto Generate"}
              </Button>
            </div>
            <Input
              id="slug"
              placeholder="judul-berita"
              disabled={autoSlug}
              {...register("slug")}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Tiptap Editor */}
          <div className="space-y-2">
            <Label>Konten</Label>
            <div className="rounded-md border">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-1 border-b p-2 bg-muted/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  data-active={editor?.isActive("bold")}
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  data-active={editor?.isActive("italic")}
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  data-active={editor?.isActive("heading", { level: 2 })}
                >
                  <Heading2 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  data-active={editor?.isActive("heading", { level: 3 })}
                >
                  <Heading3 className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  data-active={editor?.isActive("bulletList")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  data-active={editor?.isActive("orderedList")}
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  data-active={editor?.isActive("blockquote")}
                >
                  <Quote className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                  data-active={editor?.isActive("codeBlock")}
                >
                  <Code className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    editor?.chain().focus().setHorizontalRule().run()
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => editor?.chain().focus().undo().run()}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => editor?.chain().focus().redo().run()}
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
              {/* Editor */}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Right column — Settings */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Pengaturan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Kategori</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6"
                    onClick={() => setCategoryManagerOpen(true)}
                  >
                    <Settings className="mr-1 h-3 w-3" />
                    Kelola
                  </Button>
                </div>
                {categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {categories.map((cat) => (
                      <Badge key={cat.id} variant="secondary" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada kategori</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="pendidikan, sekolah, wisuda"
                  {...register("tags")}
                />
                <p className="text-xs text-muted-foreground">
                  Pisahkan dengan koma
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Thumbnail */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Thumbnail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {featuredImage ? (
                <div className="relative rounded-md overflow-hidden">
                  <img
                    src={featuredImage}
                    alt="Thumbnail"
                    className="w-full h-32 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setFeaturedImage("")}
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="thumbnail-upload"
                  className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors block"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (!file || !file.type.startsWith("image/")) return;
                    setIsUploading(true);
                    const formData = new FormData();
                    formData.append("file", file);
                    try {
                      const res = await fetch("/api/upload", { method: "POST", body: formData });
                      if (!res.ok) throw new Error("Upload gagal");
                      const data = await res.json();
                      setFeaturedImage(data.url);
                      toast.success("Thumbnail berhasil diupload");
                    } catch { toast.error("Gagal upload thumbnail"); }
                    finally { setIsUploading(false); }
                  }}
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                  ) : (
                    <ImageIcon className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm text-muted-foreground">
                    {isUploading ? "Mengupload..." : "Klik atau drag gambar ke sini"}
                  </p>
                </label>
              )}
              <input
                id="thumbnail-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploading(true);
                  const formData = new FormData();
                  formData.append("file", file);
                  try {
                    const res = await fetch("/api/upload", { method: "POST", body: formData });
                    if (!res.ok) throw new Error("Upload gagal");
                    const data = await res.json();
                    setFeaturedImage(data.url);
                    toast.success("Thumbnail berhasil diupload");
                  } catch {
                    toast.error("Gagal upload thumbnail");
                  } finally {
                    setIsUploading(false);
                    e.target.value = "";
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Excerpt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ringkasan</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ringkasan singkat berita ini..."
                rows={3}
                {...register("excerpt")}
              />
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="Deskripsi untuk mesin pencari..."
                  rows={2}
                  {...register("metaDescription")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  placeholder="keyword1, keyword2"
                  {...register("metaKeywords")}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Manager Modal */}
      <CategoryManager
        open={categoryManagerOpen}
        onOpenChange={setCategoryManagerOpen}
      />
    </div>
  );
}
