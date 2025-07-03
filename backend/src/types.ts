
export interface MediaItem {
  type: 'image' | 'video';
  url: string;
}

export interface UserProfile {
  id: string;
  date: string;
  userName: string;
  chatId?: number;
  media: MediaItem[];
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  measurements: string | null;
  about: string | null;
  notes?: string;
  rawText: string;
}

export interface ParsedProfileData {
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  measurements: string | null;
  about: string | null;
  notes?: string;
}

// Raw data types from the database
export interface ProfileRow {
    id: string;
    date: string;
    user_name: string;
    chat_id: number | null;
    name: string | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    measurements: string | null;
    about: string | null;
    notes: string | null;
    raw_text: string;
}

export interface MediaRow {
    id: string;
    profile_id: string;
    type: 'image' | 'video';
    url: string;
}
