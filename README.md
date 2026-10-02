# LearnFlow

LearnFlow is a full-stack study portal for university learners. The repository is an npm workspace monorepo:

- `web/` — React, TypeScript, and Vite learner and administrator interface.
- `server/` — Express API, course catalog, progress tracking, and administration.
- `supabase/migrations/` — PostgreSQL schema for Supabase.

Railway hosts the Node application (the API and built frontend). Supabase provides PostgreSQL and authentication.

## Requirements

- Node.js 20 or later and npm.
- A Supabase project with PostgreSQL and Email authentication enabled.

## Configure Supabase

1. In the Supabase dashboard, copy the project URL, public anon/publishable key, server-only service-role/secret key, and database connection string.
2. Copy `.env.example` to `.env` in the repository root. Set:
   - `DATABASE_URL` to the Supabase PostgreSQL connection string. Use the session pooler if the deployment host cannot connect to the direct database host.
   - `DATABASE_SSL=true` to require TLS for the database connection.
   - `DATABASE_SSL_CA_FILE` to the path of the Supabase CA certificate downloaded from **Project Settings → Database → SSL Configuration**. For local development, save it as `.local/prod-ca-2021.crt` and keep that directory untracked. The API uses this certificate to verify the database TLS chain and hostname.
   - For deployment environments where a certificate file is inconvenient, set `DATABASE_SSL_CA` to the CA certificate PEM contents as a protected, multiline environment variable instead. Set either the file path or PEM variable, not both.
   - `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the API only.
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for the frontend. Only the public anon/publishable key belongs in a `VITE_*` variable; never put the service-role key in a frontend variable.
3. Run the SQL files in `supabase/migrations/` in timestamp order in the Supabase SQL Editor, or apply them with the Supabase CLI.
4. In Supabase Authentication settings, set the minimum password length to 12 or more and configure email confirmation. In URL Configuration, add the local URL (normally `http://127.0.0.1:5173`) and deployed Railway URL to the allowed redirect URLs. Configure SMTP for reliable confirmation and recovery messages. Password recovery redirects to the current app origin.

Never commit `.env`, database passwords, the Supabase service-role key, or downloaded CA files.

## Run locally

```powershell
npm install
npm run db:seed
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://127.0.0.1:5173`). Vite proxies `/api` requests to the Express API at port 4000. Apply the Supabase schema migration before seeding or starting the app.

The seed adds 20 official course links and 20 original, topic-specific study guides for every course. Each guide has a concise explanation and a comprehension question; course detail pages link students to the provider for the complete syllabus, lectures, readings, assignments, and downloadable materials. Guides are independently written study aids, not copies or substitutes for the providers' course materials. Each course detail page also includes a source-based description, course format, and available material types, plus instructor, department, topic, textbook, image, or download information where verified on the provider's page. The seed is safe to rerun, preserves lesson IDs and progress, leaves lessons with non-seed titles untouched, and does not duplicate courses or lessons:

```powershell
npm run db:seed
```

## First administrator

Public signups always create learner accounts. After registering and confirming the owner account, promote it in the Supabase SQL Editor:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = lower('admin@example.edu');
```

Sign out and back in after promotion. Administrators can manage courses, lessons, publishing, and learner access. The API prevents the last active administrator from being demoted or disabled. Roles are read from the server-managed profile table, not user-editable authentication metadata.

## Checks and production build

```powershell
npm run check
npm run build
npm start
```

`npm start` serves the production build and API on `PORT` (default 4000). Run `npm run build` first.

## Railway deployment

1. Create a Railway Node service connected to this repository. The repository-root `railway.json` builds the workspaces, starts the API/web service, and checks `/api/health`.
2. Set the service variables using Railway's encrypted variables interface: `DATABASE_URL`, `DATABASE_SSL` if required, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `NODE_ENV=production`. Vite variables are embedded in the browser bundle at build time; set them before deploying or rebuilding.
3. Apply the Supabase migration, then run `npm run db:seed` from a Railway shell or one-off command.
4. Register and confirm the owner account, promote it with the SQL above, then test learner and administrator flows.
5. Add the deployed Railway origin to Supabase Auth's allowed redirect URLs and verify email confirmation and password reset emails.

Use a private database connection where available. The service-role key bypasses row-level security and must remain server-side. LearnFlow enables RLS on app tables and accesses data through its trusted API.

## Learning content and licenses

The starter catalog links learners to 20 official course pages from Harvard, Stanford Engineering Everywhere, and MIT OpenCourseWare. It does not copy or mirror their materials. LearnFlow's in-portal starter lessons are original explanations and quizzes, except for the clearly marked and attributed CC BY-NC excerpts from _Think Python_ and _Think DSP_. Each course displays its provider, source, license, and attribution notes. MIT OCW course pages are listed with their general CC BY-NC-SA terms, but course and individual-resource exceptions apply; review the specific resource terms before reusing anything. Third-party material may have different terms.

The included binary-search lesson is original LearnFlow-authored study material and is not a reproduction of the Harvard course.

Course pages also organize videos, lecture notes, exams, assignments, and problem sets. Administrators can add an official HTTPS resource link or upload a file they have permission to redistribute, with license and attribution recorded per resource. Uploaded files use the public Supabase Storage bucket `course-materials` (up to 100 MB each), so anyone with a resource URL can access them. Apply `20261001150000_course_resources.sql` and `20261001165500_resource_attribution.sql` after the initial schema migration before using this feature. Check and preserve the license and attribution for every resource, including student-created or instructor-provided files.

## Account and data behavior

- Supabase Auth handles registration, email confirmation, sign-in, sign-out, and password recovery.
- The browser sends Supabase access tokens as bearer tokens. The API verifies tokens with Supabase Auth and checks account status and role in `public.profiles`.
- Correct quiz answers are graded server-side and are not sent to learners.
- Lesson progress is per user and persists in Supabase PostgreSQL.
