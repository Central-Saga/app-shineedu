export interface LandingGalleryItem {
  id: number;
  title: string;
  alt?: string;
  image_path: string;
  image_url: string;
  sort_order: number | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface CreateLandingGalleryItemPayload {
  title: string;
  image: File;
  sort_order?: number | null;
  is_active?: boolean;
}

export interface UpdateLandingGalleryItemPayload {
  title?: string;
  image?: File;
  sort_order?: number | null;
  is_active?: boolean;
}
