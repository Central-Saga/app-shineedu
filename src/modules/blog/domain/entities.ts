/**
 * Blog post entity – aligned with API landing-blog and landing public/blogs.
 */

export interface BlogAuthor {
  id: number;
  name: string;
  email: string;
}

export interface BlogAsset {
  id: number;
  file_path: string;
  file_url: string;
  title?: string | null;
  description?: string | null;
  sort_order?: number | null;
}

export interface BlogPost {
  id: number;
  title: string;
  content?: string | null;
  excerpt?: string | null;
  featured_image_path?: string | null;
  featured_image_url?: string | null;
  status: string;
  category?: string | null;
  author_id: number;
  author?: BlogAuthor | null;
  assets?: BlogAsset[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateBlogPostPayload {
  title: string;
  content?: string | null;
  excerpt?: string | null;
  status: "draft" | "published";
  category?: string | null;
}

export interface UpdateBlogPostPayload {
  title?: string;
  content?: string | null;
  excerpt?: string | null;
  status?: "draft" | "published";
  category?: string | null;
}
