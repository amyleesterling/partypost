// Hand-written database types matching supabase/migrations/0001_initial.sql.
// Regenerate with `supabase gen types typescript` if you migrate further.

export type RsvpStatus = "yes" | "no" | "maybe";
export type ImageType = "hero" | "profile" | "gallery";
export type UploadedBy = "admin" | "guest";

export interface PartyRow {
  id: string;
  slug: string;
  host_user_id: string;
  birthday_child_name: string;
  birthday_age: number | null;
  party_title: string;
  description: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  location_name: string | null;
  location_address: string | null;
  map_url: string | null;
  rsvp_deadline: string | null;
  host_name: string | null;
  host_email: string | null;
  host_phone: string | null;
  gift_note: string | null;
  food_note: string | null;
  rain_plan: string | null;
  theme: string;
  hero_image_url: string | null;
  profile_image_url: string | null;
  is_password_protected: boolean;
  password_hash: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type PartyInsert = Partial<Omit<PartyRow, "id" | "created_at" | "updated_at">> & {
  slug: string;
  host_user_id: string;
  birthday_child_name: string;
  party_title: string;
};

export type PartyUpdate = Partial<Omit<PartyRow, "id" | "created_at" | "updated_at">>;

export interface RsvpRow {
  id: string;
  party_id: string;
  edit_token: string;
  status: RsvpStatus;
  parent_names: string;
  email: string;
  phone: string | null;
  child_names: string | null;
  kids_count: number;
  adults_count: number;
  total_count: number;
  allergy_notes: string | null;
  private_note: string | null;
  public_note: string | null;
  public_note_consent: boolean;
  created_at: string;
  updated_at: string;
}

export type RsvpInsert = Partial<Omit<RsvpRow, "id" | "total_count" | "created_at" | "updated_at">> & {
  party_id: string;
  edit_token: string;
  status: RsvpStatus;
  parent_names: string;
  email: string;
};

export type RsvpUpdate = Partial<Omit<RsvpRow, "id" | "total_count" | "created_at" | "updated_at">>;

export interface NoteRow {
  id: string;
  party_id: string;
  rsvp_id: string | null;
  display_name: string;
  message: string;
  is_public: boolean;
  is_approved: boolean;
  created_at: string;
}

export type NoteInsert = Partial<Omit<NoteRow, "id" | "created_at">> & {
  party_id: string;
  display_name: string;
  message: string;
};

export type NoteUpdate = Partial<Omit<NoteRow, "id" | "created_at">>;

export interface PartyImageRow {
  id: string;
  party_id: string;
  uploaded_by: UploadedBy;
  image_type: ImageType;
  image_url: string;
  caption: string | null;
  is_approved: boolean;
  created_at: string;
}

export type PartyImageInsert = Partial<Omit<PartyImageRow, "id" | "created_at">> & {
  party_id: string;
  image_url: string;
};

export type PartyImageUpdate = Partial<Omit<PartyImageRow, "id" | "created_at">>;

export type Database = {
  public: {
    Tables: {
      parties: { Row: PartyRow; Insert: PartyInsert; Update: PartyUpdate; Relationships: [] };
      rsvps: { Row: RsvpRow; Insert: RsvpInsert; Update: RsvpUpdate; Relationships: [] };
      notes: { Row: NoteRow; Insert: NoteInsert; Update: NoteUpdate; Relationships: [] };
      party_images: { Row: PartyImageRow; Insert: PartyImageInsert; Update: PartyImageUpdate; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
