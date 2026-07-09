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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addedUrls = useRef(new Map<string, string>());
  const isUpdating = useRef(false);

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

  const updateTextareaWithCheckmarks = () => {
    const textarea = textareaRef.current;
    if (!textarea || isUpdating.current) return;

    isUpdating.current = true;
    const lines = textarea.value.split('\n');

    const updatedLines = lines.map(line => {
      const cleanUrl = line.replace(/\s*✅\s*$/, '').trim();
      if (addedUrls.current.has(cleanUrl)) {
        return cleanUrl + ' ✅';
      }
      return line;
    });

    textarea.value = updatedLines.join('\n');
    isUpdating.current = false;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isUpdating.current) return;

    const text = e.target.value;
    const newLines = text.split('\n');

    for (const line of newLines) {
      const cleanUrl = line.replace(/\s*✅\s*$/, '').trim();
      if (cleanUrl && !addedUrls.current.has(cleanUrl) &&
          (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be'))) {
        const id = await addVideo(cleanUrl);
        if (id) {
          addedUrls.current.set(cleanUrl, id);
          setAllVideos(prev => [...prev, {
            id,
            youtube_url: cleanUrl,
            title: '',
            views: 0,
            notes: '',
            created_at: new Date().toISOString(),
          }]);
          updateTextareaWithCheckmarks();
        }
      }
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Backspace') {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursorPos = textarea.selectionStart;
      const text = textarea.value;
      const textBeforeCursor = text.substring(0, cursorPos);
      const textAfterCursor = text.substring(cursorPos);
      const lastNewlineBefore = textBeforeCursor.lastIndexOf('\n');
      const currentLine = textBeforeCursor.substring(lastNewlineBefore + 1);

      if (currentLine.trim() === '' && lastNewlineBefore >= 0) {
        const linesAbove = text.substring(0, lastNewlineBefore).split('\n');
        const prevLine = linesAbove[linesAbove.length - 1];
        const cleanUrl = prevLine.replace(/\s*✅\s*$/, '').trim();

        if (addedUrls.current.has(cleanUrl)) {
          e.preventDefault();
          const id = addedUrls.current.get(cleanUrl);
          if (id) {
            await deleteVideo(id);
            addedUrls.current.delete(cleanUrl);
            setAllVideos(prev => prev.filter(v => v.youtube_url !== cleanUrl));
          }
          const newText = text.substring(0, lastNewlineBefore) + textAfterCursor;
          textarea.value = newText;
          textarea.selectionStart = lastNewlineBefore;
          textarea.selectionEnd = lastNewlineBefore;
        }
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Quick Add</h1>
        <p className="text-[var(--muted)]">Type YouTube URLs, one per line. Auto-adds to collection.</p>
      </header>

      <div className="mb-4 p-4 border border-black dark:border-white">
        <p className="text-sm text-[var(--muted)] mb-2">
          ✅ appears when video is saved • Backspace empty line = delete from DB
        </p>
        <textarea
          ref={textareaRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`https://youtube.com/shorts/abc123\nhttps://youtube.com/shorts/def456\nhttps://youtu.be/ghi789`}
          className="w-full h-96 px-4 py-3 border border-black dark:border-white bg-transparent font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">All Videos ({allVideos.length})</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allVideos.map((video) => (
            <div key={video.id} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-800">
              <span className="text-green-600">✅</span>
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm underline truncate flex-1"
              >
                {video.youtube_url}
              </a>
              <button
                onClick={async () => {
                  await deleteVideo(video.id);
                  addedUrls.current.delete(video.youtube_url);
                  setAllVideos(prev => prev.filter(v => v.id !== video.id));
                  updateTextareaWithCheckmarks();
                }}
                className="text-sm text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
