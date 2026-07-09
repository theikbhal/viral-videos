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

export function LiveAddView() {
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [inputValue, setInputValue] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [addedCount, setAddedCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addedUrls = useRef(new Map<string, string>());

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/videos?limit=1000');
      const data = await response.json();
      setAllVideos(data.videos || []);
      data.videos?.forEach((v: Video) => {
        addedUrls.current.set(v.youtube_url, v.id);
      });
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
    inputRef.current?.focus();
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

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = inputValue.trim();

    if (!url || addedUrls.current.has(url)) {
      setInputValue('');
      inputRef.current?.focus();
      return;
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const id = await addVideo(url);
      if (id) {
        addedUrls.current.set(url, id);
        setAllVideos(prev => [{ id, youtube_url: url, title: '', views: 0, notes: '', created_at: new Date().toISOString() }, ...prev]);
        setLastAdded(url);
        setTimeout(() => setLastAdded(null), 2000);
      }
    }

    setInputValue('');
    inputRef.current?.focus();
  };

  const handleBulkAdd = async () => {
    const lines = bulkUrls.split('\n').map(l => l.trim()).filter(l => l);
    let count = 0;

    for (const url of lines) {
      if (!addedUrls.current.has(url) && (url.includes('youtube.com') || url.includes('youtu.be'))) {
        const id = await addVideo(url);
        if (id) {
          addedUrls.current.set(url, id);
          setAllVideos(prev => [{ id, youtube_url: url, title: '', views: 0, notes: '', created_at: new Date().toISOString() }, ...prev]);
          count++;
        }
      }
    }

    setAddedCount(count);
    setBulkUrls('');
    setTimeout(() => setAddedCount(0), 3000);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Quick Add</h1>
        <p className="text-[var(--muted)]">Paste YouTube URL, press Enter. Done.</p>
      </header>

      {lastAdded && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 text-sm z-50">
          ✅ Added
        </div>
      )}

      {addedCount > 0 && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 text-sm z-50">
          ✅ Added {addedCount} videos
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setMode('single'); setTimeout(() => inputRef.current?.focus(), 100); }}
          className={`px-4 py-2 border border-black dark:border-white text-sm ${mode === 'single' ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
        >
          Single
        </button>
        <button
          onClick={() => { setMode('bulk'); setTimeout(() => textareaRef.current?.focus(), 100); }}
          className={`px-4 py-2 border border-black dark:border-white text-sm ${mode === 'bulk' ? 'bg-black text-white dark:bg-white dark:text-black' : ''}`}
        >
          Bulk
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste YouTube URL and press Enter..."
            className="w-full px-4 py-3 border border-black dark:border-white bg-transparent text-lg focus:outline-none"
          />
        </form>
      ) : (
        <div className="mb-6">
          <textarea
            ref={textareaRef}
            value={bulkUrls}
            onChange={(e) => setBulkUrls(e.target.value)}
            placeholder={`Paste YouTube URLs here, one per line:\nhttps://youtube.com/shorts/abc123\nhttps://youtube.com/shorts/def456`}
            className="w-full h-48 px-4 py-3 border border-black dark:border-white bg-transparent font-mono text-sm resize-none focus:outline-none"
            spellCheck={false}
          />
          <button
            onClick={handleBulkAdd}
            className="mt-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white text-sm"
          >
            Add All
          </button>
        </div>
      )}

      <div className="border border-black dark:border-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Videos ({allVideos.length})</h2>
        </div>
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
                  addedUrls.current.delete(video.youtube_url);
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
