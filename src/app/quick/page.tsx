'use client';

import { LiveAddView } from '@/components/LiveAddView';
import Link from 'next/link';

export default function QuickPage() {
  return (
    <div>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Link href="/" className="underline text-sm hover:opacity-70">
          ← Back to All Videos
        </Link>
      </div>
      <LiveAddView />
    </div>
  );
}
