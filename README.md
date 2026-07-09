# Viral Videos - 1M+ Views Collection

A minimalist web app for collecting and managing viral YouTube videos with 1M+ views.

## Features

- **CRUD Operations** - Create, Read, Update, Delete videos
- **Search** - Search through your video collection
- **Pagination** - Browse through 1000+ videos efficiently
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Black & White Theme** - Clean, minimalist aesthetic
- **Dark Mode** - Automatic theme based on system preference
- **Validation** - Minimum 1M views requirement enforced

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd 1000videos
npm install
```

### 2. Environment Variables

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://fuywzjtfspfdpctrlxtj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0CYJcJvLrCDUwmRh00nL3g_hDzglYbU
```

### 3. Database Setup

Run the SQL from `SUPABASE_SCHEMA.md` in your Supabase SQL Editor.

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Production

```bash
npm run build
npm start
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/videos?page=1&search=term | List videos with pagination |
| POST | /api/videos | Add new video |
| PUT | /api/videos/:id | Update video |
| DELETE | /api/videos/:id | Delete video |

## Data Model

```typescript
{
  id: string;           // UUID
  youtube_url: string;  // Required
  title: string;        // Optional
  views: number;        // Required, min 1,000,000
  notes: string;        // Optional
  created_at: string;   // Auto-generated
  updated_at: string;   // Auto-generated
}
```

## Deployment

### Vercel

1. Push to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

### Database

The app uses Supabase with the following URL:
`https://fuywzjtfspfdpctrlxtj.supabase.co`

## License

MIT
