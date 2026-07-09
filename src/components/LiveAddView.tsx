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
  const [lines, setLines] = useState<{ url: string; id?: string; status: 'pending' | 'added' | 'error' }[]>([]);
  const [allVideos, setAllVideos] = useState<Video[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const processedUrls = useRef(new Set<string>());

  const fetchVideos = useCallback(async () => {
    try {
      const response = await fetch('/api/videos?limit=1000');
      const data = await response.json();
      setAllVideos(data.videos || []);
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

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const newLines = text.split('\n');

    const currentUrls = newLines
      .map(line => line.trim())
      .filter(line => line.includes('youtube.com') || line.includes('youtu.be'));

    const currentLineStates = newLines.map((line, index) => {
      const url = line.trim();
      const existing = lines.find(l => l.url === url && l.url);
      if (existing) return existing;

      if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
        return { url, status: 'pending' as const };
      }
      return { url: line, status: 'pending' as const };
    });

    setLines(currentLineStates);

    for (const line of currentLineStates) {
      if (line.url && !line.id && !processedUrls.current.has(line.url) &&
          (line.url.includes('youtube.com') || line.url.includes('youtu.be'))) {
        processedUrls.current.add(line.url);
        const id = await addVideo(line.url);
        if (id) {
          setLines(prev => prev.map(l =>
            l.url === line.url ? { ...l, id, status: 'added' } : l
          ));
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
        e.preventDefault();

        const lineIndex = textBeforeCursor.split('\n').length - 2;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const lineToDelete = lines[lineIndex];
          if (lineToDelete.id) {
            deleteVideo(lineToDelete.id);
            processedUrls.current.delete(lineToDelete.url);
          }

          const newText = text.substring(0, lastNewlineBefore) + textAfterCursor;
          textarea.value = newText;
          textarea.selectionStart = lastNewlineBefore;
          textarea.selectionEnd = lastNewlineBefore;

          setLines(prev => prev.filter((_, i) => i !== lineIndex));
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
          ✅ Added = saved to database • Press Backspace on empty line to delete
        </p>
        <textarea
          ref={textareaRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`https://youtube.com/shorts/abc123 ✅\nhttps://youtube.com/shorts/def456\nhttps://youtu.be/ghi789 ✅`}
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
                onClick={() => {
                  deleteVideo(video.id);
                  processedUrls.current.delete(video.youtube_url);
                  setLines(prev => prev.filter(l => l.id !== video.id));
                  setAllVideos(prev => prev.filter(v => v.id !== video.id));
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
