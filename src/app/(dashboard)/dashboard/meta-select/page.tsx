'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Page {
  id: string;
  name: string;
}

export default function MetaSelectPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/integrations/meta/pending-pages')
      .then((r) => r.json())
      .then((data) => {
        if (data.pages) {
          setPages(data.pages);
          setOrgId(data.orgId);
          if (data.pages.length > 0) setSelected(data.pages[0].id);
        } else {
          setError('Oturum süresi dolmuş. Lütfen tekrar bağlanın.');
        }
      })
      .catch(() => setError('Bir hata oluştu.'));
  }, []);

  const handleConfirm = async () => {
    if (!selected || !orgId) return;
    setLoading(true);

    // Redirect to select-page API which finalizes the connection
    window.location.href = `/api/integrations/meta/select-page?org_id=${orgId}&page_id=${selected}`;
  };

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-sm text-red-500 text-center max-w-sm">{error}</p>
        <div className="flex gap-3">
          <Button onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}>
            Tekrar Bağlan
          </Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard/settings?tab=integrations')}>
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg">
            M
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Facebook Sayfası Seç</h2>
            <p className="text-xs text-gray-500">Hangi sayfanın lead formlarını takip etmek istiyorsunuz?</p>
          </div>
        </div>

        {/* Page list */}
        {pages.length === 0 ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {pages.map((page) => (
              <button
                key={page.id}
                type="button"
                onClick={() => setSelected(page.id)}
                className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-left transition-all ${
                  selected === page.id
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300 hover:bg-indigo-50/40'
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{page.name}</p>
                  <p className="text-xs text-gray-400">ID: {page.id}</p>
                </div>
                {selected === page.id && (
                  <Check className="h-4 w-4 shrink-0 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/dashboard/settings?tab=integrations')}
          >
            İptal
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={!selected || pages.length === 0}
            onClick={handleConfirm}
          >
            Bu Sayfayı Bağla
          </Button>
        </div>
      </div>
    </div>
  );
}
