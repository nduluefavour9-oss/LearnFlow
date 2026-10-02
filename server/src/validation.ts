import { z } from "zod";

const safeExternalUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  return url.protocol === "https:";
}, "Use an HTTPS URL.");

export const courseSchema = z.object({
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(1000),
  subject: z.string().trim().min(2).max(80),
  level: z.enum(["beginner", "intermediate", "advanced", "all"]),
  provider: z.string().trim().min(2).max(120),
  sourceUrl: safeExternalUrl,
  licenseName: z.string().trim().min(2).max(120),
  licenseUrl: safeExternalUrl,
  attribution: z.string().trim().min(5).max(500),
  isPublished: z.boolean(),
});

export const lessonSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(20).max(20_000),
  position: z.number().int().min(1).max(500),
  quizQuestion: z.string().trim().min(5).max(500).nullable(),
  quizOptions: z.array(z.string().trim().min(1).max(250)).max(8),
  quizAnswerIndex: z.number().int().min(0).max(7).nullable(),
}).refine((lesson) => {
  if (lesson.quizQuestion === null) {
    return lesson.quizAnswerIndex === null && lesson.quizOptions.length === 0;
  }
  return lesson.quizOptions.length >= 2 &&
    lesson.quizAnswerIndex !== null &&
    lesson.quizAnswerIndex < lesson.quizOptions.length;
}, "Provide either no quiz or a question, at least two options, and a valid answer.");

export const courseResourceSchema = z.object({
  type: z.enum(["video", "lecture_notes", "exam", "assignment", "problem_set", "other"]),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(1000).default(""),
  licenseName: z.string().trim().min(2).max(120),
  attribution: z.string().trim().max(500).default(""),
  url: safeExternalUrl.nullable(),
  storagePath: z.string().trim().min(1).max(500).nullable(),
  contentType: z.string().trim().max(120).nullable(),
  position: z.number().int().min(1).max(5000),
}).refine((resource) => Boolean(resource.url) !== Boolean(resource.storagePath), {
  message: "Provide exactly one external URL or Supabase Storage file path.",
});

export const userUpdateSchema = z.object({
  role: z.enum(["learner", "admin"]),
  isActive: z.boolean(),
});
