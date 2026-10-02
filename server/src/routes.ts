import { Router, type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { z } from "zod";
import { pool } from "./db";
import { supabaseAdmin } from "./supabase";
import { courseResourceSchema, courseSchema, lessonSchema, userUpdateSchema } from "./validation";
import type { AuthenticatedUser, CourseDetails, CourseRecord, CourseResourceRecord, LessonRecord } from "./types";

export const router = Router();

function asyncRoute(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

function publicUser(row: {
  id: string;
  email: string;
  full_name: string;
  role: "learner" | "admin";
  is_active: boolean;
  created_at: Date;
}): AuthenticatedUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
  };
}

const requireAuth: RequestHandler = (req, res, next) => {
  const accessToken = req.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!accessToken) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  void (async () => {
    const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
    if (error || !data.user) {
      res.status(401).json({ error: "This session is invalid or has expired. Sign in again." });
      return;
    }
    const result = await pool.query(
      `SELECT id, email, full_name, role, is_active, created_at
       FROM public.profiles WHERE id = $1`,
      [data.user.id],
    );
    const row = result.rows[0];
    if (!row || !row.is_active) {
      res.status(403).json({ error: "This account is unavailable. Contact an administrator." });
      return;
    }
    res.locals.user = publicUser(row);
    next();
  })().catch(next);
};

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = res.locals.user as AuthenticatedUser | undefined;
    if (!user || user.role !== "admin") {
      res.status(403).json({ error: "Administrator access is required." });
      return;
    }
    next();
  });
}

function mapLesson(row: Record<string, unknown>, includeAnswer = false): LessonRecord {
  const lesson: LessonRecord = {
    id: String(row.id),
    courseId: String(row.course_id),
    title: String(row.title),
    body: String(row.body),
    position: Number(row.position),
    quizQuestion: row.quiz_question === null ? null : String(row.quiz_question),
    quizOptions: row.quiz_options as string[],
  };
  if (includeAnswer) {
    lesson.quizAnswerIndex = row.quiz_answer_index === null ? null : Number(row.quiz_answer_index);
  }
  return lesson;
}

function mapCourseResource(row: Record<string, unknown>): CourseResourceRecord {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    type: row.resource_type as CourseResourceRecord["type"],
    title: String(row.title),
    description: String(row.description),
    licenseName: String(row.license_name),
    attribution: String(row.attribution),
    url: row.url === null ? null : String(row.url),
    storagePath: row.storage_path === null ? null : String(row.storage_path),
    contentType: row.content_type === null ? null : String(row.content_type),
    position: Number(row.position),
  };
}

function mapCourse(
  row: Record<string, unknown>,
  lessons: LessonRecord[],
  resources: CourseResourceRecord[] = [],
): CourseRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    subject: String(row.subject),
    level: row.level as CourseRecord["level"],
    provider: String(row.provider),
    sourceUrl: String(row.source_url),
    licenseName: String(row.license_name),
    licenseUrl: String(row.license_url),
    attribution: String(row.attribution),
    details: (row.details ?? {}) as CourseDetails,
    isPublished: Boolean(row.is_published),
    lessons,
    resources,
  };
}

router.get("/auth/me", requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});

router.get("/courses", asyncRoute(async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const coursesResult = await pool.query(
    `SELECT id, slug, title, summary, subject, level, provider, source_url, license_name,
            license_url, attribution, is_published
     FROM courses
     WHERE is_published = TRUE
       AND ($1 = '' OR title ILIKE '%' || $1 || '%' OR subject ILIKE '%' || $1 || '%')
     ORDER BY updated_at DESC, title ASC`,
    [search],
  );
  const lessonCounts = await pool.query(
    `SELECT course_id, COUNT(*)::int AS count FROM lessons
     WHERE course_id = ANY($1::uuid[]) GROUP BY course_id`,
    [coursesResult.rows.map((course) => course.id)],
  );
  const counts = new Map(lessonCounts.rows.map((row) => [row.course_id, row.count]));
  res.json({
    courses: coursesResult.rows.map((course) => ({
      ...mapCourse(course, []),
      lessonCount: counts.get(course.id) ?? 0,
    })),
  });
}));

router.get("/courses/:slug", asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT id, slug, title, summary, subject, level, provider, source_url, license_name,
            license_url, attribution, details, is_published
     FROM courses WHERE slug = $1 AND is_published = TRUE`,
    [req.params.slug],
  );
  const course = result.rows[0];
  if (!course) {
    res.status(404).json({ error: "Course not found." });
    return;
  }

  const lessonResult = await pool.query(
    `SELECT id, course_id, title, body, position, quiz_question, quiz_options
     FROM lessons WHERE course_id = $1 ORDER BY position`,
    [course.id],
  );
  const resourceResult = await pool.query(
    `SELECT id, course_id, resource_type, title, description, license_name, attribution,
            url, storage_path, content_type, position
     FROM course_resources WHERE course_id = $1 ORDER BY position`,
    [course.id],
  );
  res.json({
    course: mapCourse(course, lessonResult.rows.map((lesson) => ({
      ...mapLesson(lesson),
      completed: false,
    } as LessonRecord)), resourceResult.rows.map(mapCourseResource)),
    completedLessonIds: [],
  });
}));

router.post(
  "/courses/:courseId/lessons/:lessonId/complete",
  requireAuth,
  asyncRoute(async (req, res) => {
    const answerSchema = z.object({ answerIndex: z.number().int().min(0).max(7).optional() });
    const { answerIndex } = answerSchema.parse(req.body);
    const courseId = z.string().uuid().parse(req.params.courseId);
    const lessonId = z.string().uuid().parse(req.params.lessonId);
    const lessonResult = await pool.query(
      `SELECT l.id, l.body, l.quiz_options, l.quiz_answer_index
       FROM lessons l JOIN courses c ON c.id = l.course_id
       WHERE l.id = $1 AND c.id = $2 AND c.is_published = TRUE`,
      [lessonId, courseId],
    );
    const lesson = lessonResult.rows[0];
    if (!lesson) {
      res.status(404).json({ error: "Lesson not found." });
      return;
    }
    const correctAnswerIndex = lesson.quiz_answer_index === null
      ? null
      : Number(lesson.quiz_answer_index);
    const correctAnswer = correctAnswerIndex === null
      ? null
      : (lesson.quiz_options as string[])[correctAnswerIndex];
    const isCorrect = correctAnswerIndex === null
      ? answerIndex === undefined
      : answerIndex === correctAnswerIndex;
    const explanation = String(lesson.body).split(/\n\s*\n/)[0].replace(/^Core idea:\s*/, "");

    if (!isCorrect) {
      res.json({ completed: false, correct: false, correctAnswer, explanation });
      return;
    }

    await pool.query(
      `INSERT INTO lesson_progress (user_id, lesson_id)
       VALUES ($1, $2) ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      [(res.locals.user as AuthenticatedUser).id, lesson.id],
    );
    res.json({
      completed: true,
      correct: true,
      correctAnswer,
      explanation,
      lessonId: lesson.id,
    });
  }),
);

router.get("/me/progress", requireAuth, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT c.id AS course_id, c.slug, c.title, l.id AS lesson_id, l.title AS lesson_title,
            lp.completed_at
     FROM lesson_progress lp
     JOIN lessons l ON l.id = lp.lesson_id
     JOIN courses c ON c.id = l.course_id
     WHERE lp.user_id = $1
     ORDER BY lp.completed_at DESC`,
    [(res.locals.user as AuthenticatedUser).id],
  );
  res.json({ completedLessons: result.rows });
}));

router.get("/admin/users", requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT id, email, full_name, role, is_active, created_at
     FROM public.profiles ORDER BY created_at DESC`,
  );
  res.json({ users: result.rows.map(publicUser) });
}));

router.patch("/admin/users/:userId", requireAdmin, asyncRoute(async (req, res) => {
  const input = userUpdateSchema.parse(req.body);
  const targetUserId = z.string().uuid().parse(req.params.userId);
  const currentUser = res.locals.user as AuthenticatedUser;
  if (targetUserId === currentUser.id && (input.role !== "admin" || !input.isActive)) {
    res.status(400).json({ error: "You cannot remove your own administrator access or deactivate your account." });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE public.profiles IN SHARE ROW EXCLUSIVE MODE");
    const current = await client.query(
      "SELECT role, is_active FROM public.profiles WHERE id = $1 FOR UPDATE",
      [targetUserId],
    );
    const existing = current.rows[0];
    if (!existing) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (existing.role === "admin" && existing.is_active && (input.role !== "admin" || !input.isActive)) {
      const count = await client.query(
        "SELECT COUNT(*)::int AS count FROM public.profiles WHERE role = 'admin' AND is_active = TRUE",
      );
      if (count.rows[0].count <= 1) {
        await client.query("ROLLBACK");
        res.status(409).json({ error: "The last active administrator cannot be demoted or deactivated." });
        return;
      }
    }
    const updated = await client.query(
      `UPDATE public.profiles SET role = $2, is_active = $3
       WHERE id = $1
       RETURNING id, email, full_name, role, is_active, created_at`,
      [targetUserId, input.role, input.isActive],
    );
    await client.query("COMMIT");
    res.json({ user: publicUser(updated.rows[0]) });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}));

router.get("/admin/courses", requireAdmin, asyncRoute(async (_req, res) => {
  const courseResult = await pool.query(
    `SELECT id, slug, title, summary, subject, level, provider, source_url, license_name,
            license_url, attribution, details, is_published
     FROM courses ORDER BY updated_at DESC`,
  );
  const lessonResult = await pool.query(
    `SELECT id, course_id, title, body, position, quiz_question, quiz_options, quiz_answer_index
     FROM lessons WHERE course_id = ANY($1::uuid[]) ORDER BY position`,
    [courseResult.rows.map((course) => course.id)],
  );
  const resourceResult = await pool.query(
    `SELECT id, course_id, resource_type, title, description, license_name, attribution,
            url, storage_path, content_type, position
     FROM course_resources WHERE course_id = ANY($1::uuid[]) ORDER BY position`,
    [courseResult.rows.map((course) => course.id)],
  );
  const byCourse = new Map<string, LessonRecord[]>();
  for (const lesson of lessonResult.rows) {
    const current = byCourse.get(lesson.course_id) ?? [];
    current.push(mapLesson(lesson, true));
    byCourse.set(lesson.course_id, current);
  }
  const resourcesByCourse = new Map<string, CourseResourceRecord[]>();
  for (const resource of resourceResult.rows) {
    const current = resourcesByCourse.get(resource.course_id) ?? [];
    current.push(mapCourseResource(resource));
    resourcesByCourse.set(resource.course_id, current);
  }
  res.json({
    courses: courseResult.rows.map((course) => mapCourse(
      course,
      byCourse.get(course.id) ?? [],
      resourcesByCourse.get(course.id) ?? [],
    )),
  });
}));

router.post("/admin/courses/:courseId/resources", requireAdmin, asyncRoute(async (req, res) => {
  const input = courseResourceSchema.parse(req.body);
  const courseId = z.string().uuid().parse(req.params.courseId);
  if (input.storagePath && !input.storagePath.startsWith(`${courseId}/`)) {
    res.status(400).json({ error: "Uploaded files must be stored inside their course folder." });
    return;
  }
  const result = await pool.query(
    `INSERT INTO course_resources
      (course_id, resource_type, title, description, license_name, attribution,
       url, storage_path, content_type, position)
     SELECT id, $2, $3, $4, $5, $6, $7, $8, $9, $10 FROM courses WHERE id = $1
     RETURNING id`,
    [
      courseId, input.type, input.title, input.description, input.licenseName,
      input.attribution, input.url, input.storagePath, input.contentType, input.position,
    ],
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  res.status(201).json({ id: result.rows[0].id });
}));

router.put("/admin/resources/:resourceId", requireAdmin, asyncRoute(async (req, res) => {
  const input = courseResourceSchema.parse(req.body);
  const resourceId = z.string().uuid().parse(req.params.resourceId);
  const current = await pool.query(
    "SELECT course_id FROM course_resources WHERE id = $1",
    [resourceId],
  );
  if (!current.rowCount) {
    res.status(404).json({ error: "Course resource not found." });
    return;
  }
  const courseId = String(current.rows[0].course_id);
  if (input.storagePath && !input.storagePath.startsWith(`${courseId}/`)) {
    res.status(400).json({ error: "Uploaded files must be stored inside their course folder." });
    return;
  }
  await pool.query(
    `UPDATE course_resources
     SET resource_type = $2, title = $3, description = $4, license_name = $5,
         attribution = $6, url = $7, storage_path = $8, content_type = $9, position = $10
     WHERE id = $1`,
    [
      resourceId, input.type, input.title, input.description, input.licenseName,
      input.attribution, input.url, input.storagePath, input.contentType, input.position,
    ],
  );
  res.json({ id: resourceId });
}));

router.delete("/admin/resources/:resourceId", requireAdmin, asyncRoute(async (req, res) => {
  const resourceId = z.string().uuid().parse(req.params.resourceId);
  const result = await pool.query(
    "SELECT storage_path FROM course_resources WHERE id = $1",
    [resourceId],
  );
  const resource = result.rows[0];
  if (!resource) {
    res.status(404).json({ error: "Course resource not found." });
    return;
  }
  if (resource.storage_path) {
    const { error } = await supabaseAdmin.storage
      .from("course-materials")
      .remove([String(resource.storage_path)]);
    if (error) throw error;
  }
  await pool.query("DELETE FROM course_resources WHERE id = $1", [resourceId]);
  res.status(204).end();
}));

router.post("/admin/courses", requireAdmin, asyncRoute(async (req, res) => {
  const courseInput = courseSchema.parse(req.body.course);
  const lessons = Array.isArray(req.body.lessons)
    ? req.body.lessons.map((lesson: unknown) => lessonSchema.parse(lesson))
    : [];
  const positions = new Set(lessons.map((lesson: { position: number }) => lesson.position));
  if (positions.size !== lessons.length) {
    res.status(400).json({ error: "Lesson positions must be unique within a course." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO courses
        (slug, title, summary, subject, level, provider, source_url, license_name, license_url, attribution, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        courseInput.slug, courseInput.title, courseInput.summary, courseInput.subject,
        courseInput.level, courseInput.provider, courseInput.sourceUrl, courseInput.licenseName,
        courseInput.licenseUrl, courseInput.attribution, courseInput.isPublished,
      ],
    );
    for (const lesson of lessons) {
      await client.query(
        `INSERT INTO lessons
          (course_id, title, body, position, quiz_question, quiz_options, quiz_answer_index)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
        [
          inserted.rows[0].id, lesson.title, lesson.body, lesson.position, lesson.quizQuestion,
          JSON.stringify(lesson.quizOptions), lesson.quizAnswerIndex,
        ],
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ id: inserted.rows[0].id });
  } catch (error) {
    await client.query("ROLLBACK");
    if ((error as { code?: string }).code === "23505") {
      res.status(409).json({ error: "A course with this slug or one of these lesson positions already exists." });
      return;
    }
    throw error;
  } finally {
    client.release();
  }
}));

router.put("/admin/courses/:courseId", requireAdmin, asyncRoute(async (req, res) => {
  const input = courseSchema.parse(req.body);
  const courseId = z.string().uuid().parse(req.params.courseId);
  const result = await pool.query(
    `UPDATE courses
     SET slug = $2, title = $3, summary = $4, subject = $5, level = $6, provider = $7,
         source_url = $8, license_name = $9, license_url = $10, attribution = $11,
         is_published = $12, updated_at = NOW()
     WHERE id = $1 RETURNING id`,
    [
      courseId, input.slug, input.title, input.summary, input.subject, input.level,
      input.provider, input.sourceUrl, input.licenseName, input.licenseUrl, input.attribution,
      input.isPublished,
    ],
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  res.json({ id: result.rows[0].id });
}));

router.delete("/admin/courses/:courseId", requireAdmin, asyncRoute(async (req, res) => {
  const courseId = z.string().uuid().parse(req.params.courseId);
  const resources = await pool.query(
    "SELECT storage_path FROM course_resources WHERE course_id = $1 AND storage_path IS NOT NULL",
    [courseId],
  );
  const storagePaths = resources.rows.map((row) => String(row.storage_path));
  if (storagePaths.length) {
    const { error } = await supabaseAdmin.storage.from("course-materials").remove(storagePaths);
    if (error) throw error;
  }
  const result = await pool.query("DELETE FROM courses WHERE id = $1 RETURNING id", [courseId]);
  if (!result.rowCount) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  res.status(204).end();
}));

router.post("/admin/courses/:courseId/lessons", requireAdmin, asyncRoute(async (req, res) => {
  const input = lessonSchema.parse(req.body);
  const courseId = z.string().uuid().parse(req.params.courseId);
  const result = await pool.query(
    `INSERT INTO lessons
      (course_id, title, body, position, quiz_question, quiz_options, quiz_answer_index)
     SELECT id, $2, $3, $4, $5, $6::jsonb, $7 FROM courses WHERE id = $1
     RETURNING id`,
    [
      courseId, input.title, input.body, input.position, input.quizQuestion,
      JSON.stringify(input.quizOptions), input.quizAnswerIndex,
    ],
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Course not found." });
    return;
  }
  res.status(201).json({ id: result.rows[0].id });
}));

router.put("/admin/lessons/:lessonId", requireAdmin, asyncRoute(async (req, res) => {
  const input = lessonSchema.parse(req.body);
  const lessonId = z.string().uuid().parse(req.params.lessonId);
  const result = await pool.query(
    `UPDATE lessons
     SET title = $2, body = $3, position = $4, quiz_question = $5,
         quiz_options = $6::jsonb, quiz_answer_index = $7
     WHERE id = $1 RETURNING id`,
    [
      lessonId, input.title, input.body, input.position, input.quizQuestion,
      JSON.stringify(input.quizOptions), input.quizAnswerIndex,
    ],
  );
  if (!result.rowCount) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  res.json({ id: result.rows[0].id });
}));

router.delete("/admin/lessons/:lessonId", requireAdmin, asyncRoute(async (req, res) => {
  const lessonId = z.string().uuid().parse(req.params.lessonId);
  const result = await pool.query("DELETE FROM lessons WHERE id = $1 RETURNING id", [lessonId]);
  if (!result.rowCount) {
    res.status(404).json({ error: "Lesson not found." });
    return;
  }
  res.status(204).end();
}));
