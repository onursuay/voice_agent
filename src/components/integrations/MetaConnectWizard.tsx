'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw, AlertTriangle } from 'lucide-react';

type ConnectStatus = 'pending' | 'connecting' | 'done' | 'error';

interface PageItem {
  id: string;
  name: string;
  status: ConnectStatus;
}

type Step3Phase = 'loading' | 'select' | 'connecting' | 'error';

export function MetaConnectWizard({ initialStep = 1 }: { initialStep?: number }) {
  const router = useRouter();

  // step: 1=Welcome, 2=Connect, 3=Select Pages, 4=Success
  const [step, setStep] = useState(initialStep);

  // Step 3 state
  const [step3Phase, setStep3Phase] = useState<Step3Phase>('loading');
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [orgId, setOrgId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // When step becomes 3, fetch pending pages
  useEffect(() => {
    if (step !== 3) return;
    fetchPendingPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function fetchPendingPages() {
    setStep3Phase('loading');
    const delays = [400, 900, 1800];
    for (let i = 0; i < delays.length; i++) {
      await new Promise((r) => setTimeout(r, delays[i]));
      try {
        const res = await fetch('/api/integrations/meta/pending-pages');
        const data = await res.json() as {
          pages?: { id: string; name: string }[];
          orgId?: string;
          error?: string;
        };
        if (data.pages && data.pages.length > 0) {
          const items: PageItem[] = data.pages.map((p) => ({ ...p, status: 'pending' }));
          setPages(items);
          setOrgId(data.orgId || '');
          // Start with nothing selected — user must explicitly pick
          setSelected(new Set());
          setStep3Phase('select');
          return;
        }
      } catch { /* retry */ }
    }
    setStep3Phase('error');
    setErrorMsg('Sayfalar yüklenemedi. Lütfen tekrar deneyin.');
  }

  function togglePage(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === pages.length) setSelected(new Set());
    else setSelected(new Set(pages.map((p) => p.id)));
  }

  async function handleConnect() {
    if (selected.size === 0) return;
    setStep3Phase('connecting');

    const toConnect = pages.filter((p) => selected.has(p.id));
    const results: PageItem[] = pages.map((p) => ({
      ...p,
      status: selected.has(p.id) ? 'pending' : 'done',
    }));
    setPages([...results]);

    for (let i = 0; i < toConnect.length; i++) {
      const page = toConnect[i];
      const idx = results.findIndex((r) => r.id === page.id);
      results[idx] = { ...results[idx], status: 'connecting' };
      setPages([...results]);

      try {
        const res = await fetch('/api/integrations/meta/select-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: orgId, page_id: page.id }),
        });
        const json = await res.json() as { success: boolean; error?: string };
        results[idx] = { ...results[idx], status: json.success ? 'done' : 'error' };
      } catch {
        results[idx] = { ...results[idx], status: 'error' };
      }
      setPages([...results]);
    }

    // Advance to success
    setTimeout(() => setStep(4), 600);
  }

  const doneCount = pages.filter((p) => p.status === 'done').length;

  /* ─── Progress Bar ───────────────────────────────────────── */
  const stepLabels = ['Hoşgeldin', 'Bağlan', 'Sayfalar', 'Tamamlandı'];

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  step > num ? 'bg-green-500 text-white' :
                  step === num ? 'bg-indigo-600 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {step > num ? <Check className="h-4 w-4" /> : num}
                </div>
                <span className={`mt-1 text-[10px] font-medium ${step === num ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {stepLabels[num - 1]}
                </span>
              </div>
              {num < 4 && (
                <div className={`mb-4 h-0.5 w-10 mx-1 transition-colors ${step > num ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">

          {/* ── Step 1: Welcome ──────────────────────────────── */}
          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Meta Lead Ads'ı Bağla</h2>
              <p className="mb-7 text-sm text-gray-500">
                Facebook sayfalarınızdan gelen lead formlarını otomatik olarak CRM'e aktarın.
              </p>
              <ul className="mb-7 space-y-3 text-left">
                {[
                  'Reklam formlarından lead\'leri otomatik yakala',
                  'Lead\'leri CRM\'e anında aktar',
                  'Birden fazla Facebook sayfası bağla',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setStep(2)}
                className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Başla
              </button>
            </div>
          )}

          {/* ── Step 2: Connect OAuth ─────────────────────────── */}
          {step === 2 && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Meta ile Bağlan</h2>
              <p className="mb-6 text-sm text-gray-500">
                Meta hesabınıza giriş yapın ve izinleri verin. Bir sonraki adımda hangi sayfaları bağlayacağınızı siz seçeceksiniz.
              </p>
              <div className="mb-7 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">İstenen İzinler</p>
                {['Facebook sayfalarınızı listele', 'Lead form verilerini oku', 'Webhook aboneliği yönet'].map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-600">{perm}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#1877F2] py-3 font-semibold text-white hover:bg-[#166fe5] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Meta ile Bağlan
              </button>
              <button
                onClick={() => router.push('/dashboard/integrations')}
                className="mt-3 w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          )}

          {/* ── Step 3: Page Selection / Connecting ──────────── */}
          {step === 3 && (
            <div>
              {/* Loading */}
              {step3Phase === 'loading' && (
                <div className="flex flex-col items-center gap-3 py-10">
                  <RefreshCw className="h-9 w-9 animate-spin text-indigo-600" />
                  <p className="text-sm text-gray-500">Sayfalar yükleniyor...</p>
                </div>
              )}

              {/* Error */}
              {step3Phase === 'error' && (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <p className="text-sm font-medium text-red-600">{errorMsg}</p>
                  <button
                    onClick={fetchPendingPages}
                    className="mt-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {/* Page Selection */}
              {step3Phase === 'select' && (
                <>
                  <h2 className="mb-1 text-lg font-bold text-gray-900">Sayfaları Seç</h2>
                  <p className="mb-4 text-sm text-gray-500">
                    Lead formlarını takip etmek istediğiniz sayfaları seçin.
                  </p>

                  {/* Select all */}
                  <button
                    onClick={toggleAll}
                    className="mb-3 flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${selected.size === pages.length ? 'border-indigo-600 bg-indigo-600' : 'border-gray-300 bg-white'}`}>
                      {selected.size === pages.length && <Check className="h-2.5 w-2.5 text-white" />}
                    </div>
                    {selected.size === pages.length ? 'Tümünü Kaldır' : 'Tümünü Seç'} ({pages.length} sayfa)
                  </button>

                  {/* Page list */}
                  <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                    {pages.map((page) => {
                      const isSelected = selected.has(page.id);
                      return (
                        <button
                          key={page.id}
                          onClick={() => togglePage(page.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 active:scale-[0.98] active:brightness-95 ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'}`}
                        >
                          {/* Toggle switch */}
                          <div className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ${isSelected ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${isSelected ? 'translate-x-5' : 'translate-x-0'}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`truncate text-sm font-medium transition-colors ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>{page.name}</p>
                            <p className="text-xs text-gray-400 font-mono">ID: {page.id}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => router.push('/dashboard/integrations')}
                      className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      onClick={handleConnect}
                      disabled={selected.size === 0}
                      className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {selected.size === 0 ? 'Sayfa Seçin' : `${selected.size} Sayfayı Bağla`}
                    </button>
                  </div>
                </>
              )}

              {/* Connecting progress */}
              {step3Phase === 'connecting' && (
                <>
                  <div className="mb-5 text-center">
                    <RefreshCw className="mx-auto mb-3 h-9 w-9 animate-spin text-indigo-600" />
                    <h2 className="text-lg font-bold text-gray-900">Sayfalar Bağlanıyor...</h2>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {pages.filter((p) => p.status !== 'done' || selected.has(p.id)).map((page) => (
                      <div key={page.id} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                        page.status === 'done' ? 'bg-green-50' :
                        page.status === 'error' ? 'bg-red-50' :
                        page.status === 'connecting' ? 'bg-indigo-50' : 'bg-gray-50'
                      }`}>
                        <div className="shrink-0 w-4">
                          {page.status === 'done' && <Check className="h-4 w-4 text-green-600" />}
                          {page.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                          {page.status === 'connecting' && <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />}
                          {page.status === 'pending' && <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300" />}
                        </div>
                        <span className="flex-1 truncate text-sm font-medium text-gray-700">{page.name}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {page.status === 'done' ? 'Bağlandı' :
                           page.status === 'error' ? 'Hata' :
                           page.status === 'connecting' ? 'Bağlanıyor...' : 'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Success ──────────────────────────────── */}
          {step === 4 && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Bağlantı Başarılı!</h2>
              <p className="mb-2 text-sm text-gray-500">
                Seçtiğiniz sayfalar başarıyla bağlandı. Lead formlarından gelen veriler artık CRM'e otomatik olarak aktarılacak.
              </p>
              {doneCount > 0 && (
                <p className="mb-6 text-sm font-semibold text-green-600">{doneCount} sayfa bağlandı</p>
              )}
              <button
                onClick={() => router.push('/dashboard/integrations?meta_connected=1')}
                className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Entegrasyonlara Git
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
