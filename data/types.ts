export interface Card {
  id: number;
  image: string;
  imagePosition?: string;
  lyric: string[];
  blessing: string;
  source: string;
  status: 'enabled' | 'disabled';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Question {
  id: number;
  question: string;
  correctAnswer: string;
  otherAnswers: string[];
  hint: string;
  status: 'enabled' | 'disabled';
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  position: 'homepage' | 'message' | 'popup';
  status: 'draft' | 'published' | 'disabled';
  isPinned: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export type StatusType = 'enabled' | 'disabled';
export type AnnouncementStatus = 'draft' | 'published' | 'disabled';
export type AnnouncementPosition = 'homepage' | 'message' | 'popup';