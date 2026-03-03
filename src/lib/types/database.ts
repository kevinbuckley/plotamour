// Layer 0: Types — pure TypeScript types, zero project imports

export type ProjectType = "standalone" | "series";
export type WritingStatus = "not_started" | "in_progress" | "draft_complete";

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  google_refresh_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  project_type: ProjectType;
  attribute_templates: Record<string, unknown>;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  project_id: string;
  title: string;
  description: string;
  cover_image_url: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Plotline {
  id: string;
  book_id: string;
  title: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  id: string;
  book_id: string;
  chapter_id: string;
  plotline_id: string;
  title: string;
  summary: string;
  conflict: string;
  pov_character_id: string | null;
  position: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SceneGoogleDoc {
  id: string;
  scene_id: string;
  google_doc_id: string;
  google_doc_url: string;
  word_count: number;
  last_synced_at: string | null;
  last_modified_at: string | null;
  writing_status: WritingStatus;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  custom_attributes: Record<string, unknown>;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Place {
  id: string;
  project_id: string;
  name: string;
  description: string;
  image_url: string | null;
  custom_attributes: Record<string, unknown>;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  project_id: string;
  title: string;
  content: string;
  category: string;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  project_id: string;
  name: string;
  color: string;
  category: string;
  created_at: string;
  updated_at: string;
}
