import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import "./styles.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: { flowType: "pkce", detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
  })
  : null;

type Role = "learner" | "admin";
type Level = "beginner" | "intermediate" | "advanced" | "all";
type CatalogLevel = Exclude<Level, "all">;
type AuthMode = "login" | "register" | "forgot" | "reset";
type ResourceType = "video" | "lecture_notes" | "exam" | "assignment" | "problem_set" | "other";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

interface Lesson {
  id: string;
  courseId: string;
  title: string;
  body: string;
  position: number;
  quizQuestion: string | null;
  quizOptions: string[];
  quizAnswerIndex?: number | null;
}

interface QuizFeedback {
  correct: boolean;
  correctAnswer: string | null;
  explanation: string;
}

interface CourseResource {
  id: string;
  courseId: string;
  type: ResourceType;
  title: string;
  description: string;
  licenseName: string;
  attribution: string;
  url: string | null;
  storagePath: string | null;
  contentType: string | null;
  position: number;
}

interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  subject: string;
  level: Level;
  provider: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  attribution: string;
  details: {
    description?: string;
    format?: string;
    textbook?: { title: string; url: string };
    instructors?: Array<{ name: string; url: string }>;
    departments?: Array<{ name: string; url: string }>;
    topics?: Array<{ name: string; url: string }>;
    learningResourceTypes?: string[];
    image?: { url: string; alt: string; caption: string };
    downloadUrl?: string;
  };
  isPublished: boolean;
  lessons: Lesson[];
  resources: CourseResource[];
  lessonCount?: number;
}

interface ProgressEntry {
  course_id: string;
  slug: string;
  title: string;
  lesson_id: string;
  lesson_title: string;
  completed_at: string;
}

interface CourseInput {
  slug: string;
  title: string;
  summary: string;
  subject: string;
  level: Level;
  provider: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  attribution: string;
  isPublished: boolean;
}

interface LessonInput {
  title: string;
  body: string;
  position: number;
  quizQuestion: string | null;
  quizOptions: string[];
  quizAnswerIndex: number | null;
}

interface CourseResourceInput {
  type: ResourceType;
  title: string;
  description: string;
  licenseName: string;
  attribution: string;
  url: string;
  position: number;
}

interface CourseSubmission {
  id: string;
  title: string;
  status: "pending" | "approved" | "rejected";
  review_note: string;
  created_at: string;
  reviewed_at: string | null;
  submitter_name?: string;
  submitter_email?: string;
  payload?: {
    course: Record<string, unknown>;
    lessons: LessonInput[];
    resources: Array<CourseResourceInput & { storagePath: null; contentType: null }>;
  };
}

interface CourseSubmissionInput {
  title: string;
  summary: string;
  subject: string;
  level: Level;
  slug: string;
  provider: string;
  sourceUrl: string;
  licenseName: string;
  licenseUrl: string;
  attribution: string;
  lessonTitle: string;
  lessonBody: string;
  quizQuestion: string;
  quizOptions: string;
  quizAnswerIndex: number;
  resourceTitle: string;
  resourceUrl: string;
  resourceDescription: string;
}

const emptySubmission: CourseSubmissionInput = {
  title: "", summary: "", subject: "", level: "beginner", slug: "", provider: "", sourceUrl: "https://",
  licenseName: "Review resource terms before reuse", licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  attribution: "Submitted by a LearnFlow learner; verify attribution before reuse.", lessonTitle: "", lessonBody: "",
  quizQuestion: "", quizOptions: "", quizAnswerIndex: 0, resourceTitle: "", resourceUrl: "", resourceDescription: "",
};

const resourceTypeLabels: Record<ResourceType, string> = {
  video: "Videos",
  lecture_notes: "Lecture notes",
  exam: "Exams",
  assignment: "Assignments",
  problem_set: "Problem sets",
  other: "Other materials",
};

const emptyResource: CourseResourceInput = {
  type: "lecture_notes",
  title: "",
  description: "",
  licenseName: "",
  attribution: "",
  url: "",
  position: 1,
};

const emptyCourse: CourseInput = {
  slug: "",
  title: "",
  summary: "",
  subject: "Computer Science",
  level: "beginner",
  provider: "",
  sourceUrl: "https://",
  licenseName: "",
  licenseUrl: "https://",
  attribution: "",
  isPublished: false,
};

const emptyLesson: LessonInput = {
  title: "",
  body: "",
  position: 1,
  quizQuestion: "",
  quizOptions: ["", ""],
  quizAnswerIndex: 0,
};

async function responseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({})) as { error?: string; details?: unknown };
  if (!response.ok) {
    const validationDetails = Array.isArray(data.details)
      ? data.details.map((issue) => (issue as { message?: string }).message).filter(Boolean).join(" ")
      : "";
    throw new Error([data.error ?? `Request failed (${response.status}).`, validationDetails].filter(Boolean).join(" "));
  }
  return data as T;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [page, setPage] = useState<"home" | "admin">("home");
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<CatalogLevel>("beginner");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizFeedback, setQuizFeedback] = useState<Record<string, QuizFeedback>>({});
  const [courseForm, setCourseForm] = useState<CourseInput>(emptyCourse);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormOpen, setCourseFormOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonInput>(emptyLesson);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonCourseId, setLessonCourseId] = useState<string | null>(null);
  const [resourceCourseId, setResourceCourseId] = useState<string | null>(null);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [resourceForm, setResourceForm] = useState<CourseResourceInput>(emptyResource);
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [submissionOpen, setSubmissionOpen] = useState(false);
  const [submissionForm, setSubmissionForm] = useState<CourseSubmissionInput>(emptySubmission);
  const [mySubmissions, setMySubmissions] = useState<CourseSubmission[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<CourseSubmission[]>([]);

  const request = useCallback(async <T,>(url: string, init: RequestInit = {}): Promise<T> => {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) headers.set("Authorization", `Bearer ${session.access_token}`);
    }
    return responseJson<T>(await fetch(url, { ...init, headers }));
  }, []);

  const refreshCourses = useCallback(async () => {
    const result = await request<{ courses: Course[] }>("/api/courses");
    setCourses(result.courses);
  }, [request]);

  const refreshProgress = useCallback(async () => {
    if (!user) {
      setProgress([]);
      return;
    }
    const result = await request<{ completedLessons: ProgressEntry[] }>("/api/me/progress");
    setProgress(result.completedLessons);
  }, [request, user]);

  const refreshAdminData = useCallback(async () => {
    const [courseResult, userResult, submissionResult] = await Promise.all([
      request<{ courses: Course[] }>("/api/admin/courses"),
      request<{ users: User[] }>("/api/admin/users"),
      request<{ submissions: CourseSubmission[] }>("/api/admin/submissions"),
    ]);
    setAdminCourses(courseResult.courses);
    setAdminUsers(userResult.users);
    setAdminSubmissions(submissionResult.submissions);
  }, [request]);

  useEffect(() => {
    let cancelled = false;
    if (!supabase) {
      setConnectionError(true);
      setLoading(false);
      return () => { cancelled = true; };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        return;
      }
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("reset");
        setAuthOpen(true);
      }
      if (["SIGNED_IN", "TOKEN_REFRESHED", "USER_UPDATED"].includes(event)) {
        queueMicrotask(() => {
          if (!cancelled) {
            void request<{ user: User }>("/api/auth/me")
              .then((result) => setUser(result.user))
              .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load your account."));
          }
        });
      }
    });

    if (new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery") {
      setAuthMode("reset");
      setAuthOpen(true);
    }

    void (async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const [courseResult, authResult] = await Promise.all([
          request<{ courses: Course[] }>("/api/courses"),
          session
            ? request<{ user: User }>("/api/auth/me")
            : Promise.resolve({ user: null }),
        ]);
        if (cancelled) return;
        setUser(authResult.user);
        setCourses(courseResult.courses);
      } catch {
        if (!cancelled) setConnectionError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [retryCount]);

  useEffect(() => {
    if (user) {
      refreshProgress().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load progress."));
    } else {
      setProgress([]);
    }
  }, [user, refreshProgress]);

  useEffect(() => {
    if (page === "admin" && user?.role === "admin") {
      refreshAdminData().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load administration data."));
    }
  }, [page, user, refreshAdminData]);
  useEffect(() => {
    if (!user) {
      setMySubmissions([]);
      return;
    }
    request<{ submissions: CourseSubmission[] }>("/api/submissions/mine")
      .then((result) => setMySubmissions(result.submissions))
      .catch(() => undefined);
  }, [user, request]);

  const completedLessonIds = useMemo(() => new Set(progress.map((entry) => entry.lesson_id)), [progress]);
  const completedCourses = useMemo(() => new Set(
    courses.filter((course) => {
      const lessonCount = course.lessonCount ?? course.lessons.length;
      return lessonCount > 0 &&
        progress.filter((entry) => entry.course_id === course.id).length >= lessonCount;
    }).map((course) => course.id),
  ), [progress, courses]);

  function clearMessages() {
    setError("");
    setNotice("");
  }

  async function authenticate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    try {
      if (!supabase) throw new Error("Supabase is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.");
      if (authMode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setNotice("If an account uses that email, a password reset link is on its way.");
        setAuthOpen(false);
      } else if (authMode === "reset") {
        const confirmation = String(form.get("confirmPassword") ?? "");
        if (password.length < 12 || password !== confirmation) {
          throw new Error(password.length < 12
            ? "Your new password must be at least 12 characters."
            : "The passwords do not match.");
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setAuthOpen(false);
        setNotice("Your password has been updated.");
      } else if (authMode === "register") {
        const fullName = String(form.get("fullName") ?? "").trim();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          const result = await request<{ user: User }>("/api/auth/me");
          setUser(result.user);
          setAuthOpen(false);
          setNotice(`Welcome, ${result.user.fullName.split(" ")[0]}.`);
        } else {
          setAuthOpen(false);
          setNotice("Check your email to confirm your account before signing in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        const result = await request<{ user: User }>("/api/auth/me");
        setUser(result.user);
        setAuthOpen(false);
        setNotice(`Welcome${result.user.fullName ? `, ${result.user.fullName.split(" ")[0]}` : ""}.`);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    clearMessages();
    try {
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setUser(null);
      setPage("home");
      setSelectedCourse(null);
      setNotice("You have signed out.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign out.");
    }
  }

  async function openCourse(slug: string) {
    clearMessages();
    try {
      const result = await request<{ course: Course }>("/api/courses/" + encodeURIComponent(slug));
      setSelectedCourse(result.course);
      setAnswers({});
      setQuizFeedback({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load this course.");
    }
  }

  async function completeLesson(courseId: string, lesson: Lesson) {
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      setNotice("Sign in to save your learning progress.");
      return;
    }
    const answer = answers[lesson.id];
    if (lesson.quizQuestion && answer === undefined) {
      setError("Choose an answer before submitting the quiz.");
      return;
    }
    clearMessages();
    setBusy(true);
    try {
      const result = await request<QuizFeedback & { completed: boolean }>(`/api/courses/${courseId}/lessons/${lesson.id}/complete`, {
        method: "POST",
        body: JSON.stringify(answer === null ? {} : { answerIndex: answer }),
      });
      setQuizFeedback((current) => ({ ...current, [lesson.id]: result }));
      if (!result.correct) return;
      await refreshProgress();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save lesson progress.");
    } finally {
      setBusy(false);
    }
  }

  function startNewCourse() {
    setEditingCourseId(null);
    setCourseForm(emptyCourse);
    setCourseFormOpen(true);
    setLessonCourseId(null);
    setEditingLessonId(null);
    setLessonForm(emptyLesson);
  }

  function editCourse(course: Course) {
    setEditingCourseId(course.id);
    setCourseForm({
      slug: course.slug,
      title: course.title,
      summary: course.summary,
      subject: course.subject,
      level: course.level,
      provider: course.provider,
      sourceUrl: course.sourceUrl,
      licenseName: course.licenseName,
      licenseUrl: course.licenseUrl,
      attribution: course.attribution,
      isPublished: course.isPublished,
    });
    setCourseFormOpen(true);
    setLessonCourseId(null);
    setEditingLessonId(null);
    setLessonForm({ ...emptyLesson, position: course.lessons.length + 1 });
  }

  async function saveCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setBusy(true);
    try {
      await request(editingCourseId ? `/api/admin/courses/${editingCourseId}` : "/api/admin/courses", {
        method: editingCourseId ? "PUT" : "POST",
        body: JSON.stringify(editingCourseId ? courseForm : { course: courseForm, lessons: [] }),
      });
      setNotice(editingCourseId ? "Course details updated." : "Course created. Add its lessons from the course list.");
      setCourseFormOpen(false);
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this course.");
    } finally {
      setBusy(false);
    }
  }

  function editLesson(courseId: string, lesson: Lesson) {
    setLessonCourseId(courseId);
    setEditingLessonId(lesson.id);
    setLessonForm({
      title: lesson.title,
      body: lesson.body,
      position: lesson.position,
      quizQuestion: lesson.quizQuestion ?? "",
      quizOptions: lesson.quizOptions.length ? lesson.quizOptions : ["", ""],
      quizAnswerIndex: lesson.quizAnswerIndex ?? 0,
    });
  }

  function addLesson(course: Course) {
    setCourseFormOpen(false);
    setLessonCourseId(course.id);
    setEditingLessonId(null);
    const nextPosition = course.lessons.reduce((highest, lesson) => Math.max(highest, lesson.position), 0) + 1;
    setLessonForm({ ...emptyLesson, position: nextPosition });
  }

  async function saveLesson(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lessonCourseId) return;
    const title = lessonForm.title.trim();
    const body = lessonForm.body.trim();
    const question = lessonForm.quizQuestion?.trim() ?? "";
    const options = lessonForm.quizOptions.map((option) => option.trim()).filter(Boolean);
    if (title.length < 3) {
      setError("Lesson title must be at least 3 characters.");
      return;
    }
    if (body.length < 20) {
      setError("Lesson content must be at least 20 characters.");
      return;
    }
    if (question && (question.length < 5 || options.length < 2)) {
      setError("A quiz needs a question of at least 5 characters and at least two answer choices.");
      return;
    }
    if (question && lessonForm.quizAnswerIndex !== null && lessonForm.quizAnswerIndex >= options.length) {
      setError("Select a valid correct choice for the quiz.");
      return;
    }
    const owner = adminCourses.find((course) => course.id === lessonCourseId);
    const duplicatePosition = owner?.lessons.some((lesson) => lesson.position === lessonForm.position && lesson.id !== editingLessonId);
    if (duplicatePosition) {
      setError(`Position ${lessonForm.position} is already used by another lesson in this course. Choose a different number.`);
      return;
    }
    clearMessages();
    setBusy(true);
    const payload: LessonInput = {
      ...lessonForm,
      quizQuestion: lessonForm.quizQuestion?.trim() || null,
      quizOptions: lessonForm.quizQuestion?.trim()
        ? lessonForm.quizOptions.map((option) => option.trim()).filter(Boolean)
        : [],
      quizAnswerIndex: lessonForm.quizQuestion?.trim() ? lessonForm.quizAnswerIndex : null,
    };
    try {
      await request(
        editingLessonId ? `/api/admin/lessons/${editingLessonId}` : `/api/admin/courses/${lessonCourseId}/lessons`,
        { method: editingLessonId ? "PUT" : "POST", body: JSON.stringify(payload) },
      );
      setNotice(editingLessonId ? "Lesson updated." : "Lesson added.");
      setEditingLessonId(null);
      setLessonForm({ ...emptyLesson, position: lessonForm.position + (editingLessonId ? 0 : 1) });
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save this lesson.");
    } finally {
      setBusy(false);
    }
  }

  function startAddResource(course: Course) {
    setCourseFormOpen(false);
    setLessonCourseId(null);
    setEditingLessonId(null);
    setResourceCourseId(course.id);
    setEditingResourceId(null);
    setResourceForm({ ...emptyResource, position: course.resources.length + 1 });
    setResourceFile(null);
  }

  function editResource(course: Course, resource: CourseResource) {
    setCourseFormOpen(false);
    setLessonCourseId(null);
    setEditingLessonId(null);
    setResourceCourseId(course.id);
    setEditingResourceId(resource.id);
    setResourceForm({
      type: resource.type,
      title: resource.title,
      description: resource.description,
      licenseName: resource.licenseName,
      attribution: resource.attribution,
      url: resource.url ?? "",
      position: resource.position,
    });
    setResourceFile(null);
  }

  async function saveResource(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resourceCourseId) {
      setError("Select a course before adding course material.");
      return;
    }
    if (resourceFile && !supabase) {
      setError("Supabase is not configured, so this file cannot be uploaded. Use an authorized HTTPS URL instead.");
      return;
    }
    if (!resourceForm.url.trim() && !resourceFile && !(editingResourceId && adminCourses.find((entry) => entry.id === resourceCourseId)?.resources.find((resource) => resource.id === editingResourceId)?.storagePath)) {
      setError("Enter an HTTPS URL or choose an authorized file to upload.");
      return;
    }
    const course = adminCourses.find((entry) => entry.id === resourceCourseId);
    if (!course) {
      setError("The selected course could not be found. Refresh administration data and try again.");
      return;
    }
    const duplicatePosition = course.resources.some((resource) => resource.position === resourceForm.position && resource.id !== editingResourceId);
    if (duplicatePosition) {
      setError(`Position ${resourceForm.position} is already used by another course material. Choose a different display order.`);
      return;
    }
    clearMessages();
    setBusy(true);
    let uploadedPath: string | null = null;
    let resourceSaved = false;
    try {
      let storagePath = editingResourceId
        ? course.resources.find((resource) => resource.id === editingResourceId)?.storagePath ?? null
        : null;
      let contentType = editingResourceId
        ? course.resources.find((resource) => resource.id === editingResourceId)?.contentType ?? null
        : null;
      let resourceUrl: string | null = resourceForm.url.trim() || null;

      if (resourceFile) {
        if (resourceFile.size > 100 * 1024 * 1024) {
          throw new Error("Files must be 100 MB or smaller.");
        }
        const uploadForm = new FormData();
        uploadForm.set("courseId", resourceCourseId);
        uploadForm.set("file", resourceFile);
        const uploadResult = await request<{ storagePath: string; contentType: string | null }>(
          "/api/admin/resources/upload",
          { method: "POST", body: uploadForm },
        );
        uploadedPath = uploadResult.storagePath;
        storagePath = uploadedPath;
        contentType = uploadResult.contentType;
        resourceUrl = null;
      } else if (resourceUrl) {
        storagePath = null;
        contentType = null;
      } else if (!storagePath) {
        throw new Error("Enter an official HTTPS URL or choose a file to upload.");
      }

      const payload = {
        ...resourceForm,
        url: resourceUrl,
        storagePath,
        contentType,
      };
      await request(
        editingResourceId ? `/api/admin/resources/${editingResourceId}` : `/api/admin/courses/${resourceCourseId}/resources`,
        {
          method: editingResourceId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      resourceSaved = true;
      setNotice(editingResourceId ? "Course material updated." : "Course material added.");
      setResourceCourseId(null);
      setEditingResourceId(null);
      setResourceForm({ ...emptyResource });
      setResourceFile(null);
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      if (uploadedPath && !resourceSaved) {
        await request("/api/admin/resources/delete-upload", {
          method: "POST",
          body: JSON.stringify({ storagePath: uploadedPath }),
        }).catch((cleanupError) => {
          console.error("Could not remove an unlinked course upload.", cleanupError);
        });
      }
      const detail = reason instanceof Error ? reason.message : "Could not save this course material.";
      setError(resourceSaved
        ? `Course material was saved, but follow-up cleanup or refresh failed: ${detail}`
        : detail);
    } finally {
      setBusy(false);
    }
  }

  async function deleteResource(resource: CourseResource) {
    if (!window.confirm(`Delete "${resource.title}" from this course?`)) return;
    clearMessages();
    setBusy(true);
    try {
      await request(`/api/admin/resources/${resource.id}`, { method: "DELETE" });
      setNotice("Course material deleted.");
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete this course material.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCourse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    if (!user) {
      setAuthMode("login");
      setAuthOpen(true);
      return;
    }
    const quizOptions = submissionForm.quizOptions.split("\n").map((value) => value.trim()).filter(Boolean);
    const quizQuestion = submissionForm.quizQuestion.trim();
    if (quizQuestion && (quizOptions.length < 2 || quizQuestion.length < 5)) {
      setError("Provide at least two quiz choices and a quiz question of at least 5 characters.");
      return;
    }
    const resources = submissionForm.resourceUrl.trim()
      ? [{ type: "other" as ResourceType, title: submissionForm.resourceTitle.trim() || submissionForm.title.trim(), description: submissionForm.resourceDescription.trim(), licenseName: submissionForm.licenseName, attribution: submissionForm.attribution, url: submissionForm.resourceUrl.trim(), storagePath: null, contentType: null, position: 1 }]
      : [];
    const payload = {
      course: {
        slug: submissionForm.slug.trim(), title: submissionForm.title.trim(), summary: submissionForm.summary.trim(),
        subject: submissionForm.subject.trim(), level: submissionForm.level, provider: submissionForm.provider.trim(),
        sourceUrl: submissionForm.sourceUrl.trim(), licenseName: submissionForm.licenseName.trim(),
        licenseUrl: submissionForm.licenseUrl.trim(), attribution: submissionForm.attribution.trim(),
      },
      lessons: [{ title: submissionForm.lessonTitle.trim(), body: submissionForm.lessonBody.trim(), position: 1,
        quizQuestion: quizQuestion || null, quizOptions: quizQuestion ? quizOptions : [],
        quizAnswerIndex: quizQuestion ? submissionForm.quizAnswerIndex : null }],
      resources,
    };
    setBusy(true);
    try {
      await request<{ submission: { id: string } }>("/api/submissions", { method: "POST", body: JSON.stringify(payload) });
      setNotice("Course submitted for administrator review. It will appear publicly only after approval.");
      setSubmissionOpen(false);
      setSubmissionForm(emptySubmission);
      const result = await request<{ submissions: CourseSubmission[] }>("/api/submissions/mine");
      setMySubmissions(result.submissions);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit the course.");
    } finally {
      setBusy(false);
    }
  }

  async function reviewSubmission(submissionId: string, approve: boolean) {
    const note = window.prompt(approve ? "Optional approval note" : "Reason for rejection", "") ?? "";
    clearMessages();
    setBusy(true);
    try {
      await request(`/api/admin/submissions/${submissionId}/${approve ? "approve" : "reject"}`, {
        method: "POST", body: JSON.stringify({ note }),
      });
      setNotice(approve ? "Course approved and published." : "Course submission rejected.");
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not review this submission.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteCourse(course: Course) {
    if (!window.confirm(`Delete "${course.title}" and all of its lessons and learner progress? This cannot be undone.`)) return;
    clearMessages();
    try {
      await request(`/api/admin/courses/${course.id}`, { method: "DELETE" });
      setNotice("Course deleted.");
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete course.");
    }
  }

  async function deleteLesson(lesson: Lesson) {
    if (!window.confirm(`Delete "${lesson.title}" and its saved learner progress? This cannot be undone.`)) return;
    clearMessages();
    try {
      await request(`/api/admin/lessons/${lesson.id}`, { method: "DELETE" });
      setNotice("Lesson deleted.");
      await Promise.all([refreshCourses(), refreshAdminData()]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not delete lesson.");
    }
  }

  async function updateUserAccess(target: User, role: Role, isActive: boolean) {
    clearMessages();
    try {
      await request(`/api/admin/users/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role, isActive }),
      });
      setNotice(`Access updated for ${target.email}.`);
      await refreshAdminData();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update account.");
    }
  }

  function resetToHome() {
    setPage("home");
    setSelectedCourse(null);
    clearMessages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="loading-screen" role="status" aria-live="polite" aria-busy="true">
        <div className="welcome-orbit welcome-orbit-one" aria-hidden="true" />
        <div className="welcome-orbit welcome-orbit-two" aria-hidden="true" />
        <div className="welcome-spark welcome-spark-one" aria-hidden="true">✦</div>
        <div className="welcome-spark welcome-spark-two" aria-hidden="true">✧</div>
        <div className="welcome-mark"><span className="brand-mark">L</span></div>
        <span className="welcome-kicker">A SPACE TO LEARN AND GROW</span>
        <h1>Welcome to <span>LearnFlow</span></h1>
        <p>Your next big idea starts here.</p>
        <div className="welcome-progress" aria-hidden="true"><span /></div>
      </div>
    );
  }

  if (connectionError) {
    return <div className="connection-screen"><div className="brand"><span className="brand-mark">L</span><span>LearnFlow</span></div><div><span className="eyebrow">SERVER CONNECTION</span><h1>We couldn't reach LearnFlow.</h1><p>Check that the API is running and that <code>DATABASE_URL</code>, <code>SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, <code>VITE_SUPABASE_URL</code>, and <code>VITE_SUPABASE_ANON_KEY</code> are configured in the private root <code>.env</code> file. Apply the Supabase migration before starting the app.</p><button className="button button-primary" onClick={() => { setConnectionError(false); setLoading(true); setRetryCount((count) => count + 1); }}>Try again</button></div></div>;
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" type="button" onClick={resetToHome} aria-label="LearnFlow home">
          <span className="brand-mark">L</span><span>LearnFlow</span>
        </button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={page === "home" && !selectedCourse ? "nav-link active" : "nav-link"} onClick={resetToHome}>Explore</button>
          {user && <button className="nav-link" onClick={() => { setSelectedCourse(null); setPage("home"); document.getElementById("my-progress")?.scrollIntoView({ behavior: "smooth" }); }}>My learning</button>}
          {user && <button className="nav-link" onClick={() => { setSubmissionOpen(true); clearMessages(); }}>Submit course</button>}
          {user?.role === "admin" && <button className={page === "admin" ? "nav-link active" : "nav-link"} onClick={() => { setPage("admin"); setSelectedCourse(null); clearMessages(); }}>Admin</button>}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="header-user"><span className="user-initial">{user.fullName.slice(0, 1).toUpperCase()}</span><span>{user.fullName}</span></span>
              <button className="button button-quiet button-small" onClick={() => void signOut()}>Sign out</button>
            </>
          ) : <button className="button button-primary button-small" onClick={() => { setAuthMode("login"); setAuthOpen(true); clearMessages(); }}>Sign in</button>}
        </div>
      </header>

      <main>
        {(error || notice) && (
          <div className={error ? "global-message error-message" : "global-message success-message"} role={error ? "alert" : "status"}>
            <span>{error || notice}</span><button onClick={clearMessages} aria-label="Dismiss message">×</button>
          </div>
        )}
        {page === "admin" && user?.role === "admin" ? (
          <AdminPage
            courses={adminCourses}
            users={adminUsers}
            busy={busy}
            courseForm={courseForm}
            setCourseForm={setCourseForm}
            editingCourseId={editingCourseId}
            courseFormOpen={courseFormOpen}
            setCourseFormOpen={setCourseFormOpen}
            onNewCourse={startNewCourse}
            onEditCourse={editCourse}
            onDeleteCourse={deleteCourse}
            onSaveCourse={saveCourse}
            lessonForm={lessonForm}
            setLessonForm={setLessonForm}
            lessonCourseId={lessonCourseId}
            setLessonCourseId={setLessonCourseId}
            editingLessonId={editingLessonId}
            setEditingLessonId={setEditingLessonId}
            onEditLesson={editLesson}
            onAddLesson={addLesson}
            onDeleteLesson={deleteLesson}
            onSaveLesson={saveLesson}
            resourceCourseId={resourceCourseId}
            setResourceCourseId={setResourceCourseId}
            editingResourceId={editingResourceId}
            setEditingResourceId={setEditingResourceId}
            resourceForm={resourceForm}
            setResourceForm={setResourceForm}
            resourceFile={resourceFile}
            setResourceFile={setResourceFile}
            onAddResource={startAddResource}
            onEditResource={editResource}
            onDeleteResource={deleteResource}
            onSaveResource={saveResource}
            onUpdateUser={updateUserAccess}
            submissions={adminSubmissions}
            onReviewSubmission={reviewSubmission}
          />
        ) : selectedCourse ? (
          <CourseDetail
            course={selectedCourse}
            user={user}
            completedLessonIds={completedLessonIds}
            answers={answers}
            quizFeedback={quizFeedback}
            setAnswer={(lessonId, answer) => {
              setAnswers((current) => ({ ...current, [lessonId]: answer }));
              setQuizFeedback((current) => {
                const next = { ...current };
                delete next[lessonId];
                return next;
              });
            }}
            busy={busy}
            onBack={resetToHome}
            onComplete={completeLesson}
            onOpenAuth={() => { setAuthMode("login"); setAuthOpen(true); }}
          />
        ) : (
          <HomePage
            user={user}
            courses={courses}
            search={search}
            setSearch={setSearch}
            levelFilter={levelFilter}
            setLevelFilter={setLevelFilter}
            progress={progress}
            completedCourses={completedCourses}
            onOpenCourse={openCourse}
            onOpenAuth={() => { setAuthMode("register"); setAuthOpen(true); }}
          />
        )}
      </main>

      <footer className="site-footer">
        <button className="brand footer-brand" onClick={resetToHome}><span className="brand-mark">L</span><span>LearnFlow</span></button>
        <p>Learn openly. Build understanding. Keep moving forward.</p>
        <span>Open courses remain subject to their individual licenses.</span>
      </footer>

      {submissionOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSubmissionOpen(false); }}>
          <section className="auth-modal submission-modal" role="dialog" aria-modal="true" aria-labelledby="submission-title">
            <button className="modal-close" onClick={() => setSubmissionOpen(false)} aria-label="Close submission form">×</button>
            <span className="eyebrow">STUDENT CONTRIBUTION</span>
            <h2 id="submission-title">Submit a course for review</h2>
            <p className="muted">Your course and material will remain unpublished until an administrator approves them.</p>
            <form className="form-stack submission-form" onSubmit={submitCourse}>
              <div className="form-grid">
                <label>Course title<input required minLength={3} maxLength={160} value={submissionForm.title} onChange={(e) => setSubmissionForm({ ...submissionForm, title: e.target.value, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') })} /></label>
                <label>Course slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={submissionForm.slug} onChange={(e) => setSubmissionForm({ ...submissionForm, slug: e.target.value })} /></label>
                <label>Subject<input required maxLength={80} value={submissionForm.subject} onChange={(e) => setSubmissionForm({ ...submissionForm, subject: e.target.value })} /></label>
                <label>Level<select value={submissionForm.level} onChange={(e) => setSubmissionForm({ ...submissionForm, level: e.target.value as Level })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all">All levels</option></select></label>
                <label>Provider<input required maxLength={120} value={submissionForm.provider} onChange={(e) => setSubmissionForm({ ...submissionForm, provider: e.target.value })} /></label>
                <label>Official source URL<input required type="url" value={submissionForm.sourceUrl} onChange={(e) => setSubmissionForm({ ...submissionForm, sourceUrl: e.target.value })} /></label>
                <label className="field-span">Course summary<textarea required minLength={10} maxLength={1000} rows={3} value={submissionForm.summary} onChange={(e) => setSubmissionForm({ ...submissionForm, summary: e.target.value })} /></label>
                <label>License name<input required maxLength={120} value={submissionForm.licenseName} onChange={(e) => setSubmissionForm({ ...submissionForm, licenseName: e.target.value })} /></label>
                <label>License URL<input required type="url" value={submissionForm.licenseUrl} onChange={(e) => setSubmissionForm({ ...submissionForm, licenseUrl: e.target.value })} /></label>
                <label className="field-span">Attribution<textarea required minLength={5} maxLength={500} rows={2} value={submissionForm.attribution} onChange={(e) => setSubmissionForm({ ...submissionForm, attribution: e.target.value })} /></label>
              </div>
              <div className="submission-section"><h3>First lesson</h3><div className="form-grid"><label>Lesson title<input required minLength={3} maxLength={160} value={submissionForm.lessonTitle} onChange={(e) => setSubmissionForm({ ...submissionForm, lessonTitle: e.target.value })} /></label><label className="field-span">Lesson content<textarea required minLength={20} maxLength={20000} rows={5} value={submissionForm.lessonBody} onChange={(e) => setSubmissionForm({ ...submissionForm, lessonBody: e.target.value })} /></label><label className="field-span">Quiz question (optional)<input value={submissionForm.quizQuestion} onChange={(e) => setSubmissionForm({ ...submissionForm, quizQuestion: e.target.value })} /></label>{submissionForm.quizQuestion && <><label className="field-span">Answer choices (one per line)<textarea required rows={3} value={submissionForm.quizOptions} onChange={(e) => setSubmissionForm({ ...submissionForm, quizOptions: e.target.value })} /></label><label>Correct choice number<input type="number" min={1} value={submissionForm.quizAnswerIndex + 1} onChange={(e) => setSubmissionForm({ ...submissionForm, quizAnswerIndex: Number(e.target.value) - 1 })} /></label></>}</div></div>
              <div className="submission-section"><h3>Course material (optional)</h3><div className="form-grid"><label>Material title<input maxLength={160} value={submissionForm.resourceTitle} onChange={(e) => setSubmissionForm({ ...submissionForm, resourceTitle: e.target.value })} /></label><label>Material HTTPS URL<input type="url" value={submissionForm.resourceUrl} onChange={(e) => setSubmissionForm({ ...submissionForm, resourceUrl: e.target.value })} /></label><label className="field-span">Description<textarea maxLength={1000} rows={2} value={submissionForm.resourceDescription} onChange={(e) => setSubmissionForm({ ...submissionForm, resourceDescription: e.target.value })} /></label></div></div>
              <button className="button button-primary button-wide" disabled={busy}>{busy ? "Submitting…" : "Submit for approval"}</button>
            </form>
            {mySubmissions.length > 0 && <div className="submission-history"><h3>My submissions</h3>{mySubmissions.slice(0, 5).map((submission) => <div key={submission.id}><strong>{submission.title}</strong><span className={`status-pill ${submission.status}`}>{submission.status}</span>{submission.review_note && <small>{submission.review_note}</small>}</div>)}</div>}
          </section>
        </div>
      )}

      {authOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAuthOpen(false); }}>
          <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
            <button className="modal-close" onClick={() => setAuthOpen(false)} aria-label="Close sign in">×</button>
            <span className="eyebrow">YOUR LEARNING SPACE</span>
            <h2 id="auth-title">{authMode === "register" ? "Create your account" : authMode === "forgot" ? "Reset your password" : authMode === "reset" ? "Choose a new password" : "Welcome back"}</h2>
            <p className="muted">{authMode === "register" ? "Create a free learner account to keep your progress." : authMode === "forgot" ? "We'll email you a secure link to choose a new password." : authMode === "reset" ? "Choose a new password with at least 12 characters." : "Sign in to continue learning and track your progress."}</p>
            <form className="form-stack" onSubmit={authenticate}>
              {authMode === "register" && <label>Full name<input name="fullName" required minLength={2} maxLength={100} autoComplete="name" /></label>}
              {authMode !== "reset" && <label>Email address<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>}
              {authMode !== "forgot" && <label>{authMode === "reset" ? "New password" : "Password"}<input name="password" type="password" required minLength={authMode === "login" ? 1 : 12} maxLength={128} autoComplete={authMode === "login" ? "current-password" : "new-password"} />{authMode !== "login" && <small>Use at least 12 characters.</small>}</label>}
              {authMode === "reset" && <label>Confirm new password<input name="confirmPassword" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>}
              {error && <p className="auth-error" role="alert">{error}</p>}
              <button className="button button-primary button-wide" type="submit" disabled={busy}>{busy ? "Please wait…" : authMode === "register" ? "Create account" : authMode === "forgot" ? "Send reset link" : authMode === "reset" ? "Update password" : "Sign in"}</button>
            </form>
            <p className="auth-switch">
              {authMode === "login" && <><button onClick={() => { setAuthMode("forgot"); clearMessages(); }}>Forgot password?</button><br /></>}
              {authMode === "forgot" || authMode === "reset"
                ? <button onClick={() => { setAuthMode("login"); clearMessages(); }}>Back to sign in</button>
                : <>{authMode === "register" ? "Already have an account?" : "New to LearnFlow?"}{" "}
                  <button onClick={() => { setAuthMode(authMode === "register" ? "login" : "register"); clearMessages(); }}>{authMode === "register" ? "Sign in" : "Create an account"}</button></>}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

interface HomePageProps {
  user: User | null;
  courses: Course[];
  search: string;
  setSearch: (value: string) => void;
  levelFilter: CatalogLevel;
  setLevelFilter: (value: CatalogLevel) => void;
  progress: ProgressEntry[];
  completedCourses: Set<string>;
  onOpenCourse: (slug: string) => void;
  onOpenAuth: () => void;
}

function HomePage(props: HomePageProps) {
  const { user, courses, search, setSearch, levelFilter, setLevelFilter, progress, completedCourses, onOpenCourse, onOpenAuth } = props;
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = `${course.title} ${course.subject} ${course.provider}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (course.level === levelFilter || course.level === "all");
  });
  const levelCounts = {
    beginner: courses.filter((course) => course.level === "beginner" || course.level === "all").length,
    intermediate: courses.filter((course) => course.level === "intermediate" || course.level === "all").length,
    advanced: courses.filter((course) => course.level === "advanced" || course.level === "all").length,
  };
  return (
    <>
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" />Legacy University Okija · Student learning portal</span>
            <h1>Make room for<br /><span>what you can become.</span></h1>
            <p>Explore your university courses, practise with lesson quizzes, and keep track of your learning progress.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#courses">Explore courses <span aria-hidden="true">→</span></a>
              {!user && <button className="button button-secondary" onClick={onOpenAuth}>Join LearnFlow</button>}
            </div>
            <div className="hero-proof"><span className="proof-check">✓</span><span>Learn at your pace and return to your saved progress.</span></div>
          </div>
          <div className="hero-art" aria-label="A preview of the LearnFlow course journey">
            <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
            <div className="art-glow" />
            <div className="learning-card">
              <div className="learning-card-top"><span className="tiny-label">YOUR LEARNING JOURNEY</span><span className="live-indicator">LEARNFLOW</span></div>
              <div className="journey-title">Computer science<br />starts with a question.</div>
              <div className="journey-path"><span className="path-step done">01</span><span className="path-line complete" /><span className="path-step current">02</span><span className="path-line" /><span className="path-step">03</span></div>
              <div className="journey-bottom"><div><strong>Algorithms</strong><small>Build the foundations</small></div><span className="course-symbol">&lt;/&gt;</span></div>
            </div>
            <div className="floating-note note-top"><span className="note-icon">✦</span><div><strong>Learn at your pace</strong><small>Your path, your progress</small></div></div>
            <div className="floating-note note-bottom"><span className="note-icon note-purple">✓</span><div><strong>Open knowledge</strong><small>Built on trusted sources</small></div></div>
          </div>
        </div>
        <div className="hero-bottom"><span>Courses for students at</span><strong>LEGACY UNIVERSITY OKIJA</strong><span>Computer Science and more departments to come</span></div>
      </section>

      {user && <section className="progress-overview content-width" id="my-progress">
        <div className="section-heading compact-heading"><div><span className="eyebrow">YOUR LEARNING</span><h2>Welcome back, {user.fullName.split(" ")[0]}.</h2></div><span className="progress-count">{progress.length} lesson{progress.length === 1 ? "" : "s"} completed</span></div>
        {progress.length ? <div className="progress-list">{progress.slice(0, 4).map((entry) => <div className="progress-entry" key={entry.lesson_id}><span className="completion-check">✓</span><span><strong>{entry.lesson_title}</strong><small>{entry.title}</small></span><time>{new Date(entry.completed_at).toLocaleDateString()}</time></div>)}</div> : <p className="muted">Your course progress will show here after you complete your first lesson.</p>}
      </section>}

      <section className="catalog-section content-width" id="courses">
        <div className="section-heading">
          <div><span className="eyebrow">LEGACY UNIVERSITY OKIJA</span><h2>Choose your learning level.</h2><p>Pick a level to see the Computer Science courses available for you.</p></div>
          <span className="catalog-count">{courses.length} courses</span>
        </div>
        <div className="catalog-controls">
          <label className="search-box"><span aria-hidden="true">⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses or subjects" aria-label="Search courses or subjects" /></label>
        </div>
        <div className="level-tabs" role="tablist" aria-label="Filter courses by learning level">
          {(["beginner", "intermediate", "advanced"] as const).map((level) => (
            <button
              className={`level-tab${levelFilter === level ? " selected" : ""}`}
              id={`level-tab-${level}`}
              key={level}
              type="button"
              role="tab"
              aria-selected={levelFilter === level}
              aria-controls="level-course-list"
              onClick={() => setLevelFilter(level)}
            >
              <span>{level[0].toUpperCase() + level.slice(1)}</span>
              <small>{levelCounts[level]} courses</small>
            </button>
          ))}
        </div>
        <div
          className="course-grid"
          id="level-course-list"
          role="tabpanel"
          aria-labelledby={`level-tab-${levelFilter}`}
        >
          {filteredCourses.map((course, index) => (
            <article className="course-card" key={course.id}>
              <div className={`course-cover cover-${index % 3}`}><span className="cover-kicker">{course.subject}</span><span className="cover-symbol">{String(index + 1).padStart(2, "0")}</span><span className="cover-mark">{index === 1 ? "λ" : index === 2 ? "∑" : "{ }"}</span></div>
              <div className="course-card-content">
                <div className="course-card-meta"><span className="level-pill">{course.level === "all" ? "All levels" : course.level}</span><span>{(course.lessonCount ?? course.lessons.length) > 0 ? `${course.lessonCount ?? course.lessons.length} lesson${(course.lessonCount ?? course.lessons.length) === 1 ? "" : "s"}` : "Lessons coming soon"}</span></div>
                <h3>{course.title}</h3><p className="course-summary">{course.summary}</p>
                <div className="course-provider"><span className="provider-seal">{course.provider.slice(0, 1)}</span><span>{course.provider}</span></div>
                <div className="course-card-bottom"><span className="license-chip">{course.licenseName}</span>{completedCourses.has(course.id) && <span className="completed-tag">Completed</span>}</div>
                <span className="course-open">Explore course <span aria-hidden="true">→</span></span>
              </div>
              <button
                type="button"
                className="course-card-hit-area"
                aria-label={`Open ${course.title} course details`}
                onClick={() => onOpenCourse(course.slug)}
              />
            </article>
          ))}
        </div>
        {!filteredCourses.length && <div className="empty-state"><span>⌕</span><h3>{courses.length ? "No courses at this level match your search." : "Courses are being added."}</h3><p>{courses.length ? "Try another course name or select a different level." : "Your university administrator will add courses and learning materials here."}</p>{search && <button className="button button-secondary" onClick={() => setSearch("")}>Clear search</button>}</div>}
      </section>

      <section className="trust-band">
        <div className="content-width trust-inner"><div><span className="eyebrow">OPEN LEARNING, WITH CARE</span><h2>Great resources.<br />Clear terms. No surprises.</h2></div><div className="trust-items"><div><span>01</span><strong>Learn from trusted sources</strong><p>Follow high-quality university material in a focused learning space.</p></div><div><span>02</span><strong>Know the license</strong><p>See each provider's license and attribution details before reusing content.</p></div><div><span>03</span><strong>Keep your progress</strong><p>Your account saves lesson completions so you can return to your learning.</p></div></div></div>
      </section>
    </>
  );
}

interface CourseDetailProps {
  course: Course;
  user: User | null;
  completedLessonIds: Set<string>;
  answers: Record<string, number>;
  quizFeedback: Record<string, QuizFeedback>;
  setAnswer: (lessonId: string, answer: number) => void;
  busy: boolean;
  onBack: () => void;
  onComplete: (courseId: string, lesson: Lesson) => void;
  onOpenAuth: () => void;
}

function CourseDetail(props: CourseDetailProps) {
  const { course, user, completedLessonIds, answers, quizFeedback, setAnswer, busy, onBack, onComplete, onOpenAuth } = props;
  const lessonsComplete = course.lessons.filter((lesson) => completedLessonIds.has(lesson.id)).length;
  const renderLessonBody = (lesson: Lesson) => lesson.body
    .split(/(https:\/\/[^\s]+)/g)
    .map((part, index) => {
      const punctuation = part.match(/[.,;!?]+$/)?.[0] ?? "";
      const url = punctuation ? part.slice(0, -punctuation.length) : part;
      if (!url.startsWith("https://")) return part;
      return <React.Fragment key={`${lesson.id}-source-${index}`}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a>{punctuation}</React.Fragment>;
    });
  const getResourceUrl = (resource: CourseResource) => resource.storagePath
    ? supabase?.storage.from("course-materials").getPublicUrl(resource.storagePath).data.publicUrl ?? ""
    : resource.url ?? "";
  const resourceGroups = (Object.keys(resourceTypeLabels) as ResourceType[])
    .map((type) => ({
      type,
      resources: course.resources.filter((resource) => resource.type === type),
    }))
    .filter((group) => group.resources.length > 0);
  return (
    <section className="course-detail content-width">
      <button className="back-link" onClick={onBack}>← All courses</button>
      <div className="course-detail-hero"><span className="eyebrow">{course.provider} · {course.subject}</span><h1>{course.title}</h1><p>{course.summary}</p><div className="detail-tags"><span>{course.level === "all" ? "All levels" : `${course.level} level`}</span><span>{course.lessons.length > 0 ? `${course.lessons.length} LearnFlow lesson${course.lessons.length === 1 ? "" : "s"}` : "Official course materials"}</span><span>{course.licenseName}</span></div></div>
      {(course.details.description || course.details.instructors?.length || course.details.departments?.length || course.details.topics?.length || course.details.learningResourceTypes?.length || course.details.image) && <section className="ocw-course-info">
        <div className="ocw-course-description"><span className="eyebrow">COURSE DESCRIPTION</span><h2>About this course</h2><p>{course.details.description}</p>{course.details.textbook && <p>Textbook: <a href={course.details.textbook.url} target="_blank" rel="noopener noreferrer"><em>{course.details.textbook.title}</em></a>.</p>}{course.details.format && <div className="ocw-format"><h3>Course Format</h3><p>{course.details.format}</p></div>}<a className="ocw-original-link" href={course.sourceUrl} target="_blank" rel="noopener noreferrer">View original course page and full syllabus ↗</a></div>
        <div className="ocw-course-info-panel"><span className="eyebrow">COURSE INFO</span>
          {course.details.instructors?.length ? <div className="ocw-info-row"><h3>Instructor</h3><ul>{course.details.instructors.map((instructor) => <li key={instructor.url}><a href={instructor.url} target="_blank" rel="noopener noreferrer">{instructor.name}</a></li>)}</ul></div> : null}
          {course.details.departments?.length ? <div className="ocw-info-row"><h3>Departments</h3><ul>{course.details.departments.map((department) => <li key={department.url}><a href={department.url} target="_blank" rel="noopener noreferrer">{department.name}</a></li>)}</ul></div> : null}
          {course.details.topics?.length ? <div className="ocw-info-row"><h3>Topics</h3><ul>{course.details.topics.map((topic) => <li key={topic.url}><a href={topic.url} target="_blank" rel="noopener noreferrer">{topic.name}</a></li>)}</ul></div> : null}
          {course.details.learningResourceTypes?.length ? <div className="ocw-info-row"><h3>Learning Resource Types</h3><ul className="ocw-resource-types">{course.details.learningResourceTypes.map((type) => <li key={type}>{type}</li>)}</ul></div> : null}
          <a className="ocw-original-link" href={course.sourceUrl} target="_blank" rel="noopener noreferrer">Official source ↗</a>
          {course.details.downloadUrl && <a className="button button-primary button-small ocw-download" href={course.details.downloadUrl} target="_blank" rel="noopener noreferrer">Download this course ↗</a>}
        </div>
        {course.details.image && <figure className="ocw-course-image"><img src={course.details.image.url} alt={course.details.image.alt} loading="lazy" /><figcaption>{course.details.image.caption}</figcaption></figure>}
      </section>}
      <div className="detail-layout">
        <div className="lesson-column">
          <section className="course-materials">
            <div className="lesson-column-heading"><div><span className="eyebrow">LEARNING MATERIALS</span><h2>Videos, notes & practice</h2></div><span className="progress-count">{course.resources.length} resource{course.resources.length === 1 ? "" : "s"}</span></div>
            {resourceGroups.length ? resourceGroups.map((group) => <section className="material-group" key={group.type}><h3>{resourceTypeLabels[group.type]}</h3><div className="material-list">{group.resources.map((resource) => {
              const url = getResourceUrl(resource);
              const isVideo = group.type === "video" && Boolean(resource.storagePath) &&
                (resource.contentType?.startsWith("video/") ?? false);
              return <article className="material-card" key={resource.id}>
                <div className="material-card-heading"><div><strong>{resource.title}</strong>{resource.description && <p>{resource.description}</p>}</div>
                  {url && <a className="button button-secondary button-small" href={url} target="_blank" rel="noopener noreferrer" download={resource.storagePath ? true : undefined}>{resource.storagePath ? "Download ↗" : "Open source ↗"}</a>}
                </div>
                {isVideo && <video className="course-video" controls preload="metadata" src={url}>Your browser does not support embedded video.</video>}
                <div className="resource-terms"><strong>{resource.licenseName}</strong>{resource.attribution && <p>{resource.attribution}</p>}</div>
              </article>;
            })}</div></section>) : <div className="material-empty"><strong>Course materials are being added.</strong><p>Lecture videos, notes, exams, assignments, and problem sets will appear here as they are added.</p><a href={course.sourceUrl} target="_blank" rel="noopener noreferrer">Browse the official course materials ↗</a></div>}
          </section>
          <div className="study-guide-notice"><div><strong>Original LearnFlow study guides</strong><p>These concise topic summaries and questions are original study aids, not the full university course. For detailed explanations, lectures, readings, downloadable notes, and complete assignments, use the provider's official materials and follow their terms.</p></div><a href={course.sourceUrl} target="_blank" rel="noopener noreferrer">Study the full official course ↗</a></div>
          <div className="lesson-column-heading"><div><span className="eyebrow">COURSE CONTENT</span><h2>Your learning path</h2></div>{course.lessons.length > 0 && <span className="progress-count">{lessonsComplete} / {course.lessons.length} complete</span>}</div>
          {course.lessons.length ? course.lessons.map((lesson) => {
            const complete = completedLessonIds.has(lesson.id);
            const feedback = quizFeedback[lesson.id];
            return (
              <article className="lesson-card" key={lesson.id}>
                <div className="lesson-number">{String(lesson.position).padStart(2, "0")}</div>
                <div className="lesson-content">
                  <h3>{lesson.title}</h3>
                  <p className="lesson-text">{renderLessonBody(lesson)}</p>
                  {lesson.quizQuestion ? (
                    <fieldset className="lesson-quiz">
                      <legend>Check your understanding</legend>
                      <p>{lesson.quizQuestion}</p>
                      {lesson.quizOptions.map((option, index) => (
                        <label key={option}>
                          <input
                            type="radio"
                            name={`quiz-${lesson.id}`}
                            checked={answers[lesson.id] === index}
                            onChange={() => setAnswer(lesson.id, index)}
                          />
                          {option}
                        </label>
                      ))}
                      {feedback && (
                        <div
                          className={feedback.correct ? "quiz-feedback is-correct" : "quiz-feedback is-incorrect"}
                          role={feedback.correct ? "status" : "alert"}
                          aria-live="polite"
                        >
                          <strong>{feedback.correct ? "Correct!" : "Not quite."}</strong>
                          {!feedback.correct && feedback.correctAnswer && (
                            <p><b>Correct answer:</b> {feedback.correctAnswer}</p>
                          )}
                          <p><b>Why:</b> {feedback.explanation}</p>
                          {feedback.correct && <span>Your progress has been saved.</span>}
                        </div>
                      )}
                      {user ? (
                        <button
                          className="button button-primary button-small"
                          disabled={busy || complete}
                          onClick={() => onComplete(course.id, lesson)}
                        >
                          {complete ? "Lesson complete ✓" : busy ? "Checking…" : feedback?.correct ? "Answer correct" : "Check answer"}
                        </button>
                      ) : (
                        <button className="button button-secondary button-small" onClick={onOpenAuth}>
                          Sign in to save progress
                        </button>
                      )}
                    </fieldset>
                  ) : user ? (
                    <button className="button button-secondary button-small" disabled={busy || complete} onClick={() => onComplete(course.id, lesson)}>
                      {complete ? "Lesson complete ✓" : "Mark lesson complete"}
                    </button>
                  ) : (
                    <button className="button button-secondary button-small" onClick={onOpenAuth}>Sign in to save progress</button>
                  )}
                </div>
                <span className={complete ? "lesson-status is-complete" : "lesson-status"}>{complete ? "✓" : "○"}</span>
              </article>
            );
          }) : <div className="empty-state"><h3>No lessons have been added yet.</h3><p>{course.provider === "Legacy University Okija" ? "The university administrator can add lessons, quizzes, and assignment links for this course." : "This catalog entry links to the provider's official course materials. We link out rather than copy materials whose licenses may restrict reuse."}</p><a className="button button-secondary" href={course.sourceUrl} target="_blank" rel="noopener noreferrer">{course.provider === "Legacy University Okija" ? "Visit Legacy University ↗" : "Open official course ↗"}</a></div>}
        </div>
        <aside className="course-source-card"><span className="eyebrow">COURSE SOURCE</span><h3>Continue with the provider</h3><p>Open the official course for its full syllabus, activities, and course-specific resources.</p><a className="button button-primary button-wide" href={course.sourceUrl} target="_blank" rel="noopener noreferrer">Visit official course ↗</a><div className="source-detail"><span>PROVIDER</span><strong>{course.provider}</strong></div><div className="source-detail"><span>LICENSE</span><strong>{course.licenseName}</strong><a href={course.licenseUrl} target="_blank" rel="noopener noreferrer">Review reuse terms ↗</a></div><div className="source-attribution"><span>ATTRIBUTION</span><p>{course.attribution}</p></div></aside>
      </div>
    </section>
  );
}

interface AdminPageProps {
  courses: Course[];
  users: User[];
  busy: boolean;
  courseForm: CourseInput;
  setCourseForm: React.Dispatch<React.SetStateAction<CourseInput>>;
  editingCourseId: string | null;
  courseFormOpen: boolean;
  setCourseFormOpen: (open: boolean) => void;
  onNewCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
  onSaveCourse: (event: React.FormEvent<HTMLFormElement>) => void;
  lessonForm: LessonInput;
  setLessonForm: React.Dispatch<React.SetStateAction<LessonInput>>;
  lessonCourseId: string | null;
  setLessonCourseId: (courseId: string | null) => void;
  editingLessonId: string | null;
  setEditingLessonId: (lessonId: string | null) => void;
  onEditLesson: (courseId: string, lesson: Lesson) => void;
  onAddLesson: (course: Course) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  onSaveLesson: (event: React.FormEvent<HTMLFormElement>) => void;
  resourceCourseId: string | null;
  setResourceCourseId: (courseId: string | null) => void;
  editingResourceId: string | null;
  setEditingResourceId: (resourceId: string | null) => void;
  resourceForm: CourseResourceInput;
  setResourceForm: React.Dispatch<React.SetStateAction<CourseResourceInput>>;
  resourceFile: File | null;
  setResourceFile: (file: File | null) => void;
  onAddResource: (course: Course) => void;
  onEditResource: (course: Course, resource: CourseResource) => void;
  onDeleteResource: (resource: CourseResource) => void;
  onSaveResource: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateUser: (user: User, role: Role, isActive: boolean) => void;
  submissions: CourseSubmission[];
  onReviewSubmission: (submissionId: string, approve: boolean) => void;
}

function AdminPage(props: AdminPageProps) {
  const {
    courses, users, busy, courseForm, setCourseForm, editingCourseId, courseFormOpen, setCourseFormOpen,
    onNewCourse, onEditCourse, onDeleteCourse, onSaveCourse, lessonForm, setLessonForm, lessonCourseId,
    editingLessonId, setLessonCourseId, setEditingLessonId, onEditLesson, onAddLesson,
    onDeleteLesson, onSaveLesson, resourceCourseId, setResourceCourseId, editingResourceId,
    setEditingResourceId, resourceForm, setResourceForm,
    resourceFile, setResourceFile, onAddResource, onEditResource, onDeleteResource, onSaveResource,
    onUpdateUser, submissions, onReviewSubmission,
  } = props;
  const [tab, setTab] = useState<"courses" | "users" | "submissions">("courses");
  const [lessonOptionsText, setLessonOptionsText] = useState(lessonForm.quizOptions.join("\n"));
  const courseFormRef = useRef<HTMLFormElement>(null);
  const lessonFormRef = useRef<HTMLFormElement>(null);
  const lessonCourse = courses.find((course) => course.id === lessonCourseId);
  const resourceCourse = courses.find((course) => course.id === resourceCourseId);

  useEffect(() => setLessonOptionsText(lessonForm.quizOptions.join("\n")), [lessonForm.quizOptions]);
  useEffect(() => {
    if (courseFormOpen) courseFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [courseFormOpen]);
  useEffect(() => {
    if (lessonCourseId) lessonFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [lessonCourseId]);

  return (
    <section className="admin-page content-width">
      <div className="admin-welcome"><div><span className="eyebrow"><span className="eyebrow-dot" />LEARNFLOW ADMINISTRATION</span><h1>Manage your learning space.</h1><p>Maintain course metadata, lessons, publishing status, and learner access.</p></div><div className="admin-total"><strong>{courses.length}</strong><span>courses</span><strong>{users.length}</strong><span>accounts</span></div></div>
      <div className="admin-tabs" role="tablist"><button role="tab" aria-selected={tab === "courses"} className={tab === "courses" ? "admin-tab selected" : "admin-tab"} onClick={() => setTab("courses")}>Courses <span>{courses.length}</span></button><button role="tab" aria-selected={tab === "submissions"} className={tab === "submissions" ? "admin-tab selected" : "admin-tab"} onClick={() => setTab("submissions")}>Submissions <span>{submissions.filter((submission) => submission.status === "pending").length}</span></button><button role="tab" aria-selected={tab === "users"} className={tab === "users" ? "admin-tab selected" : "admin-tab"} onClick={() => setTab("users")}>Learners <span>{users.length}</span></button></div>

      {tab === "courses" ? <section className="admin-panel">
        <div className="admin-panel-heading"><div><h2>Course catalog</h2><p>Published courses are visible to learners. Keep license and attribution information accurate.</p></div><button className="button button-primary" onClick={onNewCourse}>+ Add course</button></div>
        {courseFormOpen && <form ref={courseFormRef} className="admin-form" onSubmit={onSaveCourse}><div className="form-heading"><div><span className="eyebrow">{editingCourseId ? "EDIT COURSE" : "NEW COURSE"}</span><h3>{editingCourseId ? "Update course details" : "Add a course"}</h3></div><button type="button" className="button button-quiet button-small" onClick={() => setCourseFormOpen(false)}>Cancel</button></div><div className="form-grid">
          <label>Course title<input required minLength={3} maxLength={160} value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} /></label>
          <label>Course slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={courseForm.slug} onChange={(e) => setCourseForm({ ...courseForm, slug: e.target.value })} /><small>Lowercase words separated by hyphens.</small></label>
          <label>Provider<input required value={courseForm.provider} onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })} /></label>
          <label>Subject<input required value={courseForm.subject} onChange={(e) => setCourseForm({ ...courseForm, subject: e.target.value })} /></label>
          <label>Level<select value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value as Level })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all">All levels</option></select></label>
          <label>Official course URL<input required type="url" value={courseForm.sourceUrl} onChange={(e) => setCourseForm({ ...courseForm, sourceUrl: e.target.value })} /></label>
          <label>License name<input required value={courseForm.licenseName} onChange={(e) => setCourseForm({ ...courseForm, licenseName: e.target.value })} /></label>
          <label>License / terms URL<input required type="url" value={courseForm.licenseUrl} onChange={(e) => setCourseForm({ ...courseForm, licenseUrl: e.target.value })} /></label>
          <label className="field-span">Summary<textarea required rows={3} value={courseForm.summary} onChange={(e) => setCourseForm({ ...courseForm, summary: e.target.value })} /></label>
          <label className="field-span">Attribution and reuse notes<textarea required rows={2} value={courseForm.attribution} onChange={(e) => setCourseForm({ ...courseForm, attribution: e.target.value })} /></label>
          <label className="checkbox-label field-span"><input type="checkbox" checked={courseForm.isPublished} onChange={(e) => setCourseForm({ ...courseForm, isPublished: e.target.checked })} />Publish this course to learners</label>
        </div><div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingCourseId ? "Save course" : "Create course"}</button></div></form>}

        <div className="admin-course-list">{courses.map((course) => <article className="admin-course" key={course.id}><div className="admin-course-main"><span className={course.isPublished ? "status-pill published" : "status-pill draft"}>{course.isPublished ? "Published" : "Draft"}</span><h3>{course.title}</h3><p>{course.provider} · {course.lessons.length} lessons · {course.licenseName}</p><small>{course.slug}</small></div><div className="admin-course-actions"><button className="button button-secondary button-small" onClick={() => onEditCourse(course)}>Edit details</button><button className="button button-danger button-small" onClick={() => onDeleteCourse(course)}>Delete</button></div>
          <div className="admin-lessons"><div className="admin-lessons-heading"><strong>Lessons</strong><span>{course.lessons.length}</span></div>{course.lessons.map((lesson) => <div className="admin-lesson-row" key={lesson.id}><span>{String(lesson.position).padStart(2, "0")}</span><strong>{lesson.title}</strong><button onClick={() => onEditLesson(course.id, lesson)}>Edit</button><button className="text-danger" onClick={() => onDeleteLesson(lesson)}>Delete</button></div>)}<button className="add-lesson-button" onClick={() => onAddLesson(course)}>+ Add lesson</button></div>
          <div className="admin-lessons"><div className="admin-lessons-heading"><strong>Course materials</strong><span>{course.resources.length}</span></div>{course.resources.map((resource) => <div className="admin-lesson-row" key={resource.id}><span>{String(resource.position).padStart(2, "0")}</span><strong>{resourceTypeLabels[resource.type]}: {resource.title}</strong><button onClick={() => onEditResource(course, resource)}>Edit</button><button className="text-danger" onClick={() => onDeleteResource(resource)}>Delete</button></div>)}<button className="add-lesson-button" onClick={() => onAddResource(course)}>+ Add course material</button></div>
        </article>)}</div>

        {lessonCourseId && <form ref={lessonFormRef} className="admin-form lesson-admin-form" onSubmit={onSaveLesson}><div className="form-heading"><div><span className="eyebrow">{editingLessonId ? "EDIT LESSON" : "NEW LESSON"}</span><h3>{editingLessonId ? "Update lesson" : "Add a course lesson"}</h3><p className="admin-form-course">For course: <strong>{lessonCourse?.title ?? "Course unavailable"}</strong></p></div><button type="button" className="button button-quiet button-small" onClick={() => { setLessonCourseId(null); setEditingLessonId(null); setLessonForm({ ...emptyLesson }); }}>Close</button></div><div className="form-grid"><label>Lesson title<input required value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} /></label><label>Position<input type="number" min={1} value={lessonForm.position} onChange={(e) => setLessonForm({ ...lessonForm, position: Number(e.target.value) })} /></label><label className="field-span">Lesson content<textarea required rows={7} value={lessonForm.body} onChange={(e) => setLessonForm({ ...lessonForm, body: e.target.value })} /></label><label className="field-span">Quiz question (optional)<input value={lessonForm.quizQuestion ?? ""} onChange={(e) => setLessonForm({ ...lessonForm, quizQuestion: e.target.value })} /></label>{lessonForm.quizQuestion && <><label className="field-span">Answer choices (one per line)<textarea required rows={4} value={lessonOptionsText} onChange={(e) => { setLessonOptionsText(e.target.value); setLessonForm({ ...lessonForm, quizOptions: e.target.value.split("\n").map((option) => option.trim()).filter(Boolean) }); }} /></label><label>Correct choice number<select value={lessonForm.quizAnswerIndex ?? 0} onChange={(e) => setLessonForm({ ...lessonForm, quizAnswerIndex: Number(e.target.value) })}>{lessonForm.quizOptions.map((option, index) => <option key={`${index}-${option}`} value={index}>{index + 1}. {option || `Choice ${index + 1}`}</option>)}</select><small>The answer stays private; learners only receive the options.</small></label></>}</div><div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingLessonId ? "Save lesson" : "Add lesson"}</button></div></form>}
        {resourceCourseId && <form className="admin-form lesson-admin-form" onSubmit={onSaveResource}><div className="form-heading"><div><span className="eyebrow">{editingResourceId ? "EDIT MATERIAL" : "NEW MATERIAL"}</span><h3>{editingResourceId ? "Update course material" : "Add course material"}</h3><p className="admin-form-course">For course: <strong>{resourceCourse?.title ?? "Course unavailable"}</strong></p></div><button type="button" className="button button-quiet button-small" onClick={() => { setResourceCourseId(null); setEditingResourceId(null); setResourceForm({ ...emptyResource }); setResourceFile(null); }}>Close</button></div><div className="form-grid"><label>Material type<select value={resourceForm.type} onChange={(event) => setResourceForm({ ...resourceForm, type: event.target.value as ResourceType })}>{Object.entries(resourceTypeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}</select></label><label>Display order<input type="number" min={1} value={resourceForm.position} onChange={(event) => setResourceForm({ ...resourceForm, position: Number(event.target.value) })} /></label><label className="field-span">Title<input required minLength={2} maxLength={160} value={resourceForm.title} onChange={(event) => setResourceForm({ ...resourceForm, title: event.target.value })} /></label><label className="field-span">Description<textarea rows={2} maxLength={1000} value={resourceForm.description} onChange={(event) => setResourceForm({ ...resourceForm, description: event.target.value })} /></label><label>Resource license<input required minLength={2} maxLength={120} value={resourceForm.licenseName} onChange={(event) => setResourceForm({ ...resourceForm, licenseName: event.target.value })} placeholder="e.g. CC BY-NC-SA 4.0" /><small>Confirm the terms for this specific resource.</small></label><label>Attribution<textarea rows={2} maxLength={500} value={resourceForm.attribution} onChange={(event) => setResourceForm({ ...resourceForm, attribution: event.target.value })} placeholder="Creator, source, and required credit" /></label><label className="field-span">Official HTTPS URL<input type="url" value={resourceForm.url} onChange={(event) => { setResourceForm({ ...resourceForm, url: event.target.value }); if (event.target.value) setResourceFile(null); }} placeholder="https://..." /><small>Use a direct file URL or the official provider page.</small></label><label className="field-span">Or upload an authorized file<input type="file" accept=".pdf,.zip,.txt,.md,.mp4,.webm,.mov,.mp3,.m4a,.wav,application/pdf,video/mp4,video/webm,audio/mpeg" onChange={(event) => { const file = event.target.files?.[0] ?? null; setResourceFile(file); if (file) setResourceForm({ ...resourceForm, url: "" }); }} />{resourceFile && <small>Selected file: {resourceFile.name}</small>}<small>Uploads are public and downloadable, up to 100 MB. Upload only materials you have permission to redistribute.</small></label></div><div className="form-actions"><button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingResourceId ? "Save material" : "Add material"}</button></div></form>}
      </section> : tab === "submissions" ? <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Student course submissions</h2><p>Review course content and materials before publishing them to learners.</p></div></div><div className="submission-review-list">{submissions.map((submission) => <article className="submission-review-card" key={submission.id}><div className="submission-review-heading"><div><strong>{submission.title}</strong><small>{submission.submitter_name} · {submission.submitter_email}</small></div><span className={`status-pill ${submission.status}`}>{submission.status}</span></div>{submission.payload && <p>{String(submission.payload.course.summary ?? "")}</p>}<div className="submission-review-actions">{submission.status === "pending" ? <><button className="button button-primary button-small" disabled={busy} onClick={() => onReviewSubmission(submission.id, true)}>Approve & publish</button><button className="button button-danger button-small" disabled={busy} onClick={() => onReviewSubmission(submission.id, false)}>Reject</button></> : submission.review_note ? <small>Review: {submission.review_note}</small> : null}</div></article>)}{!submissions.length && <p className="muted empty-table">No course submissions have been received yet.</p>}</div></section> : <section className="admin-panel"><div className="admin-panel-heading"><div><h2>Learner accounts</h2><p>Deactivate accounts or change account roles. Protect administrator access.</p></div></div><div className="user-table-wrap"><table className="user-table"><thead><tr><th>LEARNER</th><th>ROLE</th><th>STATUS</th><th>JOINED</th><th>ACCESS</th></tr></thead><tbody>{users.map((account) => <tr key={account.id}><td><strong>{account.fullName}</strong><small>{account.email}</small></td><td><span className="role-pill">{account.role}</span></td><td><span className={account.isActive ? "status-dot active-dot" : "status-dot inactive-dot"} />{account.isActive ? "Active" : "Inactive"}</td><td>{new Date(account.createdAt).toLocaleDateString()}</td><td><div className="user-actions"><select aria-label={`Role for ${account.email}`} value={account.role} onChange={(event) => onUpdateUser(account, event.target.value as Role, account.isActive)}><option value="learner">Learner</option><option value="admin">Admin</option></select><button className="text-button" onClick={() => onUpdateUser(account, account.role, !account.isActive)}>{account.isActive ? "Deactivate" : "Reactivate"}</button></div></td></tr>)}</tbody></table>{!users.length && <p className="muted empty-table">No learner accounts have registered yet.</p>}</div></section>}
      <p className="admin-security-note"><strong>Security reminder:</strong> first admin access is granted directly in PostgreSQL. Never expose database credentials or the session secret in the browser.</p>
    </section>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("LearnFlow root element is missing.");
const root = (import.meta.hot?.data.root as Root | undefined) ?? createRoot(container);
if (import.meta.hot) import.meta.hot.data.root = root;
root.render(<React.StrictMode><App /></React.StrictMode>);
