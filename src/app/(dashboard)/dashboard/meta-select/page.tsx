'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Page {
  id: string;
  name: string;
}

type ConnectStatus = 'idle' | 'connecting' | 'done' | 'error';

interface PageResult {
  pageId: string;
  pageName: string;
  status: ConnectStatus;
  error?: string;
}

export default function MetaSelectPage() {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [orgId, setOrgId] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [results, setResults] = useState<PageResult[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch('/api/integrations/meta/pending-pages')
      .then((r) => r.json())
      .then((data) => {
        if (data.pages && data.pages.length > 0) {
          setPages(data.pages);
          setOrgId(data.orgId);
          // Pre-select all pages by default
          setSelected(new Set(data.pages.map((p: Page) => p.id)));
        } else {
          setSessionError('Oturum süresi dolmuş. Lütfen tekrar bağlanın.');
        }
      })
      .catch(() => setSessionError('Bir hata oluştu.'));
  }, []);

  const togglePage = (pageId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === pages.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pages.map((p) => p.id)));
    }
  };

  const handleConnect = async () => {
    if (!orgId || selected.size === 0) return;
    setLoading(true);

    const selectedPages = pages.filter((p) => selected.has(p.id));
    const initialResults: PageResult[] = selectedPages.map((p) => ({
      pageId: p.id,
      pageName: p.name,
      status: 'idle',
    }));
    setResults(initialResults);

    // Connect each selected page sequentially
    const finalResults = [...initialResults];
    for (let i = 0; i < selectedPages.length; i++) {
      const page = selectedPages[i];
      finalResults[i] = { ...finalResults[i], status: 'connecting' };
      setResults([...finalResults]);

      try {
        const res = await fetch('/api/integrations/meta/select-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: orgId, page_id: page.id }),
        });
        const json = await res.json() as { success: boolean; error?: string };
        if (json.success) {
          finalResults[i] = { ...finalResults[i], status: 'done' };
        } else {
          finalResults[i] = { ...finalResults[i], status: 'error', error: json.error || `HTTP ${res.status}` };
        }
      } catch {
        finalResults[i] = { ...finalResults[i], status: 'error', error: 'Bağlantı hatası' };
      }
      setResults([...finalResults]);
    }

    setLoading(false);
    setDone(true);
  };

  const allDone = results.length > 0 && results.every((r) => r.status === 'done' || r.status === 'error');
  const anySuccess = results.some((r) => r.status === 'done');

  if (sessionError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg className="h-6 w-6 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/></svg>
        </div>
        <p className="text-sm text-gray-600 text-center max-w-sm">{sessionError}</p>
        <div className="flex gap-3">
          <Button onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}>
            Tekrar Bağlan
          </Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard/integrations')}>
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  // Results screen after connecting
  if (done) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
              <Facebook className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Bağlantı Sonuçları</h2>
              <p className="text-xs text-gray-500">{results.filter(r => r.status === 'done').length}/{results.length} sayfa bağlandı</p>
            </div>
          </div>

          <div className="space-y-2">
            {results.map((r) => (
              <div key={r.pageId} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${r.status === 'done' ? 'bg-green-50' : 'bg-red-50'}`}>
                <span className="text-sm font-medium text-gray-800 truncate">{r.pageName}</span>
                {r.status === 'done' ? (
                  <span className="text-xs text-green-600 font-medium shrink-0 ml-2">Bağlandı</span>
                ) : (
                  <span className="text-xs text-red-500 shrink-0 ml-2">Hata</span>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex gap-3">
            {!anySuccess && (
              <Button variant="secondary" className="flex-1" onClick={() => { setDone(false); setResults([]); }}>
                Tekrar Dene
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={() => router.push(anySuccess ? '/dashboard/integrations?meta_connected=1' : '/dashboard/integrations')}
            >
              {anySuccess ? 'Entegrasyonlara Git' : 'Geri Dön'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600">
            <Facebook className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Facebook Sayfaları</h2>
            <p className="text-xs text-gray-500">Lead formlarını takip etmek istediğiniz sayfaları seçin</p>
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
          <>
            {/* Select all */}
            <button
              type="button"
              onClick={toggleAll}
              className="mb-2 flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
            >
              <div className={`h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${selected.size === pages.length ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {selected.size === pages.length && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              {selected.size === pages.length ? 'Tümünü Kaldır' : 'Tümünü Seç'} ({pages.length} sayfa)
            </button>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {pages.map((page) => {
                const isSelected = selected.has(page.id);
                return (
                  <button
                    key={page.id}
                    type="button"
                    onClick={() => togglePage(page.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    <div className={`h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                      {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">{page.name}</p>
                      <p className="text-xs text-gray-400 font-mono">ID: {page.id}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Connecting progress */}
        {results.length > 0 && !allDone && (
          <div className="mt-4 space-y-1.5">
            {results.map((r) => (
              <div key={r.pageId} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                <span className="text-xs text-gray-700 truncate">{r.pageName}</span>
                {r.status === 'connecting' && <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500 shrink-0" />}
                {r.status === 'done' && <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />}
                {r.status === 'idle' && <span className="h-3.5 w-3.5 rounded-full border border-gray-300 shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/dashboard/integrations')}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            className="flex-1"
            loading={loading}
            disabled={selected.size === 0 || pages.length === 0}
            onClick={handleConnect}
          >
            {selected.size === 0 ? 'Sayfa Seçin' : `${selected.size} Sayfayı Bağla`}
          </Button>
        </div>
      </div>
    </div>
  );
}
