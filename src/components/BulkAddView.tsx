'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Video {
  id: string;
  youtube_url: string;
  title: string;
  views: number;
  notes: string;
  created_at: string;
}

function normalizeUrl(url: string): string {
  return url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, 'https://www.');
}

export function BulkAddView() {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [bulkUrls, setBulkUrls] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addedUrls = useRef(new Map<string, string>());

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/videos?limit=1000');
      const data = await response.json();
      setAllVideos(data.videos || []);
      data.videos?.forEach((v: Video) => {
        addedUrls.current.set(normalizeUrl(v.youtube_url), v.id);
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    textareaRef.current?.focus();
  }, [fetchVideos]);

  const addVideo = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ youtube_url: url, views: 0 }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.id;
      }
      return null;
    } catch {
      return null;
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await fetch(`/api/videos/${id}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const handleBulkAdd = async () => {
    setProcessing(true);
    const lines = bulkUrls.split('\n');
    let count = 0;
    const newLines: string[] = [];

    for (const line of lines) {
      const url = line.replace(/\s*✅\s*$/, '').trim();
      if (!url) {
        newLines.push(line);
        continue;
      }

      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      if (!isYoutube) {
        newLines.push(line);
        continue;
      }

      const normalized = normalizeUrl(url);
      if (addedUrls.current.has(normalized)) {
        newLines.push(url + ' ✅');
        continue;
      }

      const id = await addVideo(url);
      if (id) {
        addedUrls.current.set(normalized, id);
        setAllVideos(prev => [{ id, youtube_url: url, title: '', views: 0, notes: '', created_at: new Date().toISOString() }, ...prev]);
        newLines.push(url + ' ✅');
        count++;
      } else {
        newLines.push(url);
      }
    }

    newLines.push('');
    setBulkUrls(newLines.join('\n'));
    setAddedCount(count);
    setProcessing(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.value.length;
        textareaRef.current.selectionEnd = textareaRef.current.value.length;
        textareaRef.current.focus();
      }
    }, 50);

    setTimeout(() => setAddedCount(0), 3000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Bulk Add</h1>
        <p className="text-[var(--muted)]">Paste multiple YouTube URLs, one per line.</p>
      </header>

      {addedCount > 0 && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 text-sm z-50">
          ✅ Added {addedCount} videos
        </div>
      )}

      <div className="mb-6">
        <textarea
          ref={textareaRef}
          value={bulkUrls}
          onChange={(e) => setBulkUrls(e.target.value)}
          placeholder={`Paste YouTube URLs here, one per line:\nhttps://youtube.com/shorts/abc123\nhttps://youtube.com/shorts/def456\nhttps://youtu.be/ghi789`}
          className="w-full h-64 px-4 py-3 border border-black dark:border-white bg-transparent font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />
        <button
          onClick={handleBulkAdd}
          disabled={processing || !bulkUrls.trim()}
          className="mt-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-sm disabled:opacity-50"
        >
          {processing ? 'Adding...' : 'Add All'}
        </button>
      </div>

      <div className="border border-black dark:border-white p-4">
        <h2 className="text-lg font-bold mb-3">Videos ({allVideos.length})</h2>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {allVideos.map((video) => (
            <div key={video.id} className="flex items-center gap-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-900">
              <span className="text-green-600">✓</span>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline truncate flex-1"
              >
                {video.youtube_url}
              </a>
              <button
                onClick={async () => {
                  await deleteVideo(video.id);
                  addedUrls.current.delete(normalizeUrl(video.youtube_url));
                  setAllVideos(prev => prev.filter(v => v.id !== video.id));
                }}
                className="text-red-600 hover:underline text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
