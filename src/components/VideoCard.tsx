'use client';

interface Video {
  id: string;
  youtube_url: string;
  title: string;
  views: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface VideoCardProps {
  video: Video;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
}

function extractVideoId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
}

function formatViews(views: number): string {
  if (views >= 1000000000) return `${(views / 1000000000).toFixed(1)}B`;
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views.toString();
}

export function VideoCard({ video, onEdit, onDelete }: VideoCardProps) {
  const videoId = extractVideoId(video.youtube_url);

  return (
    <div className="border border-black dark:border-white p-4">
      {videoId && (
        <div className="aspect-video mb-3 bg-gray-100 dark:bg-gray-900">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg line-clamp-2">
          {video.title || 'Untitled'}
        </h3>
        <p className="text-sm text-[var(--muted)]">
          {formatViews(video.views)} views
        </p>
        {video.notes && (
          <p className="text-sm text-[var(--muted)] line-clamp-2">{video.notes}</p>
        )}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onEdit(video)}
            className="text-sm underline hover:opacity-70"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(video.id)}
            className="text-sm underline hover:opacity-70 text-red-600"
          >
            Delete
          </button>
          <a
            href={video.youtube_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline hover:opacity-70 ml-auto"
          >
            Watch →
          </a>
        </div>
      </div>
    </div>
  );
}
