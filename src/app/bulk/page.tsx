'use client';

import { BulkAddView } from '@/components/BulkAddView';
import Link from 'next/link';

export default function BulkPage() {
  return (
    <div>
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Link href="/" className="underline text-sm hover:opacity-70">
          ← Back to All Videos
        </Link>
      </div>
      <BulkAddView />
    </div>
  );
}
