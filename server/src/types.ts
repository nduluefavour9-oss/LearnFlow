export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName: string;
  role: "learner" | "admin";
  isActive: boolean;
  createdAt: string;
}

export interface LessonRecord {
  id: string;
  courseId: string;
  title: string;
  body: string;
  position: number;
  quizQuestion: string | null;
  quizOptions: string[];
  quizAnswerIndex?: number | null;
}

export type CourseResourceType =
  | "video"
  | "lecture_notes"
  | "exam"
  | "assignment"
  | "problem_set"
  | "other";

export interface CourseResourceRecord {
  id: string;
  courseId: string;
  type: CourseResourceType;
  title: string;
  description: string;
  licenseName: string;
  attribution: string;
  url: string | null;
  storagePath: string | null;
  contentType: string | null;
  position: number;
}

export interface CourseDetails {
  description?: string;
  format?: string;
  textbook?: { title: string; url: string };
  instructors?: Array<{ name: string; url: string }>;
  departments?: Array<{ name: string; url: string }>;
  topics?: Array<{ name: string; url: string }>;
  learningResourceTypes?: string[];
  image?: { url: string; alt: string; caption: string };
  downloadUrl?: string;
}

export interface CourseRecord {
  id: string;
  slug: string;
  title: string;
  summary: string;
  subject: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  provider: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  attribution: string;
  details: CourseDetails;
  isPublished: boolean;
  lessons: LessonRecord[];
  resources: CourseResourceRecord[];
}
