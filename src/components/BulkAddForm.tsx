'use client';

import { useState } from 'react';

interface BulkAddFormProps {
  onAdd: (urls: string[]) => Promise<void>;
  onCancel: () => void;
}

export function BulkAddForm({ onAdd, onCancel }: BulkAddFormProps) {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const urlList = urls
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.includes('youtube.com') || line.includes('youtu.be')));

    if (urlList.length === 0) {
      setResult({ success: 0, failed: 0, errors: ['No valid YouTube URLs found'] });
      setLoading(false);
      return;
    }

    await onAdd(urlList);
    setLoading(false);
  };

  return (
    <div className="border border-black dark:border-white p-4 mb-8">
      <h2 className="text-xl font-bold mb-4">Bulk Add Videos</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            YouTube URLs (one per line)
          </label>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={`https://youtube.com/shorts/abc123\nhttps://youtube.com/shorts/def456\nhttps://youtu.be/ghi789`}
            className="w-full px-3 py-2 border border-black dark:border-white bg-transparent font-mono text-sm"
            rows={8}
          />
          <p className="text-xs text-[var(--muted)] mt-1">
            Paste one YouTube URL per line. Invalid URLs will be skipped.
          </p>
        </div>
        {result && (
          <div className="text-sm">
            <p className="text-green-600">Added: {result.success} videos</p>
            {result.errors.length > 0 && (
              <p className="text-red-600">Failed: {result.errors.join(', ')}</p>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white hover:opacity-80 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add All'}
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
