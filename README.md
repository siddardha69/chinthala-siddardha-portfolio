# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Fill in your real values locally.
3. Never commit `.env` to git.

## Cloudinary Image Upload (Admin)

Admin project image uploads use Cloudinary. Add these variables in `.env`:

```
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
REACT_APP_CLOUDINARY_FOLDER=portfolio-projects
```

Notes:
- `REACT_APP_CLOUDINARY_UPLOAD_PRESET` must be an unsigned upload preset.
- You can still paste an image URL manually in admin forms.

## Supabase Resume Upload (Admin)

Resume drag-and-drop uploads use Supabase Storage. Add these variables in `.env`:

```
REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key
REACT_APP_SUPABASE_RESUME_TABLE=portfolio_resume
REACT_APP_SUPABASE_RESUME_BUCKET=resumes
REACT_APP_SUPABASE_RESUME_FOLDER=portfolio
```

Notes:
- Make the resume bucket public (or serve signed URLs from a backend).
- Admin uploads only PDF files for resume.
- `REACT_APP_SUPABASE_RESUME_TABLE` enables cross-device sync for the resume URL metadata.

Use this SQL in Supabase SQL Editor:

```sql
create table if not exists public.portfolio_resume (
  id text primary key,
  url text not null,
  file_name text not null default 'Resume.pdf',
  updated_at timestamptz not null default now()
);

alter table public.portfolio_resume enable row level security;

create policy "Public read resume"
on public.portfolio_resume
for select
to anon
using (true);

create policy "Public write resume"
on public.portfolio_resume
for all
to anon
using (true)
with check (true);
```

## Supabase Projects Sync (Cross-Device)

Project CRUD now uses Supabase when configured, so updates appear across browsers/devices.

Add this variable in `.env`:

```
REACT_APP_SUPABASE_PROJECTS_TABLE=portfolio_projects
```

Use this SQL in Supabase SQL Editor:

```sql
create table if not exists public.portfolio_projects (
  id text primary key,
  title text not null,
  image text not null,
  github text not null,
  demo text not null default '',
  tags jsonb not null default '[]'::jsonb,
  desc text not null,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  is_popular boolean not null default false,
  created_at bigint not null,
  sort_order bigint not null default 0
);

alter table public.portfolio_projects enable row level security;

create policy "Public read projects"
on public.portfolio_projects
for select
to anon
using (true);

create policy "Public write projects"
on public.portfolio_projects
for all
to anon
using (true)
with check (true);
```

Notes:
- The above write policy is convenient for a portfolio admin running fully client-side.
- For stronger security, move writes behind a server endpoint and use stricter policies.

## Supabase Experience Sync (Cross-Device)

Experience skills CRUD and reordering use localStorage by default.  
To sync skills across browsers/devices, set this variable:

```
REACT_APP_SUPABASE_EXPERIENCE_TABLE=portfolio_experience
```

Use this SQL in Supabase SQL Editor:

```sql
create table if not exists public.portfolio_experience (
  id text primary key,
  category text not null check (category in ('frontend', 'backend')),
  skill text not null,
  level text not null default 'Intermediate',
  sort_order bigint not null default 0,
  created_at bigint not null
);

alter table public.portfolio_experience enable row level security;

create policy "Public read experience"
on public.portfolio_experience
for select
to anon
using (true);

create policy "Public write experience"
on public.portfolio_experience
for all
to anon
using (true)
with check (true);
```

## Supabase Qualification Sync (Cross-Device)

Qualification timeline CRUD uses localStorage by default.  
To sync qualification entries across browsers/devices, set:

```
REACT_APP_SUPABASE_QUALIFICATION_TABLE=portfolio_qualification
```

Use this SQL in Supabase SQL Editor:

```sql
create table if not exists public.portfolio_qualification (
  id text primary key,
  category text not null check (category in ('education', 'experience')),
  title text not null,
  subtitle text not null,
  period text not null,
  sort_order bigint not null default 0,
  created_at bigint not null
);

alter table public.portfolio_qualification enable row level security;

create policy "Public read qualification"
on public.portfolio_qualification
for select
to anon
using (true);

create policy "Public write qualification"
on public.portfolio_qualification
for all
to anon
using (true)
with check (true);
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
