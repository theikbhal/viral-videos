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
  const [lastAdded, setLastAdded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const addedUrls = useRef(new Map<string, string>());
  const isProcessing = useRef(false);

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

  const updateTextareaWithCheckmarks = (addedUrl?: string) => {
    const textarea = textareaRef.current;
    if (!textarea || isProcessing.current) return;

    isProcessing.current = true;
    const lines = textarea.value.split('\n');

    const updatedLines = lines.map(line => {
      const cleanUrl = line.replace(/\s*✅\s*$/, '').trim();
      if (cleanUrl && addedUrls.current.has(normalizeUrl(cleanUrl))) {
        return cleanUrl + ' ✅';
      }
      return line;
    });

    let newText = updatedLines.join('\n');

    if (addedUrl) {
      const linesArr = newText.split('\n');
      const addedLineIndex = linesArr.findIndex(l => normalizeUrl(l.replace(/\s*✅\s*$/, '').trim()) === normalizeUrl(addedUrl));
      if (addedLineIndex >= 0) {
        const isLastLine = addedLineIndex === linesArr.length - 1;
        const nextLine = linesArr[addedLineIndex + 1];
        const hasEmptyLineAfter = nextLine?.trim() === '';

        if (isLastLine || !hasEmptyLineAfter) {
          linesArr.splice(addedLineIndex + 1, 0, '');
        }
        newText = linesArr.join('\n');
        textarea.value = newText;

        const newLineIndex = addedLineIndex + 1;
        const cursorPos = newText.split('\n').slice(0, newLineIndex + 1).join('\n').length;
        textarea.selectionStart = cursorPos;
        textarea.selectionEnd = cursorPos;
        textarea.focus();
      } else {
        textarea.value = newText;
      }
    } else {
      textarea.value = newText;
    }

    isProcessing.current = false;
  };

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isProcessing.current) return;

    const text = e.target.value;
    const lines = text.split('\n');

    for (const line of lines) {
      const cleanUrl = line.replace(/\s*✅\s*$/, '').trim();
      if (cleanUrl && !addedUrls.current.has(normalizeUrl(cleanUrl)) &&
          (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be'))) {
        const id = await addVideo(cleanUrl);
        if (id) {
          addedUrls.current.set(normalizeUrl(cleanUrl), id);
          setAllVideos(prev => [{ id, youtube_url: cleanUrl, title: '', views: 0, notes: '', created_at: new Date().toISOString() }, ...prev]);
          setLastAdded(true);
          setTimeout(() => setLastAdded(false), 2000);
          updateTextareaWithCheckmarks(cleanUrl);
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
        const normalized = normalizeUrl(cleanUrl);

        if (addedUrls.current.has(normalized)) {
          e.preventDefault();
          const id = addedUrls.current.get(normalized);
          if (id) {
            await deleteVideo(id);
            addedUrls.current.delete(normalized);
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
      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Bulk Add</h1>
        <p className="text-[var(--muted)]">Paste YouTube URLs, one per line. Auto-adds.</p>
      </header>

      {lastAdded && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 text-sm z-50">
          ✅ Added
        </div>
      )}

      <div className="mb-6">
        <p className="text-sm text-[var(--muted)] mb-2">
          ✅ appears when added • Backspace empty line = delete
        </p>
        <textarea
          ref={textareaRef}
          value={bulkUrls}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Paste YouTube URLs here, one per line:\nhttps://youtube.com/shorts/abc123\nhttps://youtube.com/shorts/def456`}
          className="w-full h-64 px-4 py-3 border border-black dark:border-white bg-transparent font-mono text-sm resize-none focus:outline-none"
          spellCheck={false}
        />
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
                  updateTextareaWithCheckmarks();
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
