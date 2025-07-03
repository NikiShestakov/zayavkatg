
export interface MediaItem {
  type: 'image' | 'video';
  url: string; // base64 data URL
}

export interface UserProfile {
  id: string;
  date: string;
  userName: string;
  chatId?: number; // User's chat ID for potential bot communication
  media: MediaItem[];
  name: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  measurements: string | null;
  about: string | null;
  notes?: string;
  rawText: string; // The original text user entered
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

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        sendData: (data: string) => void;
        close: () => void;
        initDataUnsafe: {
          user?: {
            id: number;
            username?: string;
          };
        };
      };
    };
  }
}
