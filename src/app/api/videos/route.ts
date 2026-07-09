import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * limit;

  let query = supabase
    .from('viral_videos')
    .select('*', { count: 'exact' });

  if (search) {
    query = query.or(`title.ilike.%${search}%,notes.ilike.%${search}%,youtube_url.ilike.%${search}%`);
  }

  query = query
    .order('views', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    videos: data,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.json();
  const { youtube_url, title, views, notes } = body;

  if (!youtube_url) {
    return NextResponse.json({ error: 'YouTube URL is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('viral_videos')
    .insert([{ youtube_url, title, views: views || 0, notes }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
