'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoCard } from '@/components/VideoCard';
import { VideoForm } from '@/components/VideoForm';
import { BulkAddForm } from '@/components/BulkAddForm';
import { SearchBar } from '@/components/SearchBar';
import { Pagination } from '@/components/Pagination';
import { Stats } from '@/components/Stats';

interface Video {
  id: string;
  youtube_url: string;
  title: string;
  views: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);

  const fetchVideos = useCallback(async (page: number = 1, searchTerm: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (searchTerm) {
        params.set('search', searchTerm);
      }
      const response = await fetch(`/api/videos?${params}`);
      const data = await response.json();
      setVideos(data.videos || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(pagination.page, search);
  }, [fetchVideos, pagination.page, search]);

  const handleSearch = (term: string) => {
    setSearch(term);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAdd = async (video: Omit<Video, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      const data = await response.json();
      if (response.ok) {
        setShowForm(false);
        fetchVideos(pagination.page, search);
      } else {
        alert(data.error || 'Failed to add video');
      }
    } catch (error) {
      console.error('Error adding video:', error);
      alert('Error adding video');
    }
  };

  const handleUpdate = async (video: Omit<Video, 'id' | 'created_at' | 'updated_at'>) => {
    if (!editingVideo) return;
    try {
      const response = await fetch(`/api/videos/${editingVideo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(video),
      });
      if (response.ok) {
        setEditingVideo(null);
        fetchVideos(pagination.page, search);
      }
    } catch (error) {
      console.error('Error updating video:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video?')) return;
    try {
      const response = await fetch(`/api/videos/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchVideos(pagination.page, search);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const handleBulkAdd = async (urls: string[]) => {
    let success = 0;
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const response = await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ youtube_url: url, views: 0 }),
        });
        if (response.ok) {
          success++;
        } else {
          const data = await response.json();
          errors.push(data.error || url);
        }
      } catch {
        errors.push(url);
      }
    }

    setShowBulkForm(false);
    fetchVideos(1, '');

    if (errors.length > 0) {
      alert(`Added ${success} videos. Failed: ${errors.join(', ')}`);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Viral Videos</h1>
        <p className="text-[var(--muted)]">Collecting videos with 1M+ views</p>
      </header>

      <Stats total={pagination.total} />

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <SearchBar onSearch={handleSearch} />
        <button
          onClick={() => {
            setEditingVideo(null);
            setShowForm(true);
            setShowBulkForm(false);
          }}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white hover:opacity-80 transition-opacity"
        >
          + Add Video
        </button>
        <button
          onClick={() => {
            setShowForm(false);
            setShowBulkForm(true);
          }}
          className="px-4 py-2 border border-black dark:border-white hover:opacity-80 transition-opacity"
        >
          + Bulk Add
        </button>
      </div>

      {(showForm || editingVideo) && (
        <VideoForm
          initialData={editingVideo}
          onSubmit={editingVideo ? handleUpdate : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setEditingVideo(null);
          }}
        />
      )}

      {showBulkForm && (
        <BulkAddForm
          onAdd={handleBulkAdd}
          onCancel={() => setShowBulkForm(false)}
        />
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--muted)]">Loading...</div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted)]">
          {search ? 'No videos found' : 'No videos yet. Add your first viral video!'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onEdit={setEditingVideo}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
