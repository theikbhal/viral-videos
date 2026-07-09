'use client';

import { useState } from 'react';

interface Video {
  id: string;
  youtube_url: string;
  title: string;
  views: number;
  notes: string;
}

interface VideoFormProps {
  initialData?: Video | null;
  onSubmit: (video: Omit<Video, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export function VideoForm({ initialData, onSubmit, onCancel }: VideoFormProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtube_url || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [views, setViews] = useState(initialData?.views?.toString() || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!youtubeUrl) {
      setError('YouTube URL is required');
      return;
    }

    const viewCount = parseInt(views) || 0;
    if (viewCount < 1000000) {
      setError('Minimum 1,000,000 views required');
      return;
    }

    onSubmit({
      youtube_url: youtubeUrl,
      title,
      views: viewCount,
      notes,
    });
  };

  return (
    <div className="border border-black dark:border-white p-4 mb-8">
      <h2 className="text-xl font-bold mb-4">
        {initialData ? 'Edit Video' : 'Add Video'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            YouTube URL *
          </label>
          <input
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/shorts/..."
            className="w-full px-3 py-2 border border-black dark:border-white bg-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video title"
            className="w-full px-3 py-2 border border-black dark:border-white bg-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Views * (min 1,000,000)
          </label>
          <input
            type="number"
            value={views}
            onChange={(e) => setViews(e.target.value)}
            placeholder="1000000"
            min="1000000"
            className="w-full px-3 py-2 border border-black dark:border-white bg-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes..."
            className="w-full px-3 py-2 border border-black dark:border-white bg-transparent"
            rows={3}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white hover:opacity-80"
          >
            {initialData ? 'Update' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-black dark:border-white hover:opacity-80"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
