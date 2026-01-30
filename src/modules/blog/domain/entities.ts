export interface Author {
  id: number;
  name: string;
  email: string;
}

export interface BlogAsset {
  id: number;
  blog_id: number;
  file_path: string;
  file_url: string;
  title?: string | null;
  description?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Blog {
  id: number;
  author_id: number;
  title: string;
  content: string;
  status: string;
  category: "tips" | "travel" | "trips";
  created_at?: string | null;
  updated_at?: string | null;
  author?: Author | null;
  assets?: BlogAsset[];
}

export interface CreateBlogPayload {
  title: string;
  content: string;
  status: "published" | "draft";
  category: "tips" | "travel" | "trips";
}

export interface UpdateBlogPayload {
  title?: string;
  content?: string;
  status?: "published" | "draft";
  category?: "tips" | "travel" | "trips";
}

export interface CreateBlogAssetPayload {
  file: File;
  title?: string | null;
  description?: string | null;
}
