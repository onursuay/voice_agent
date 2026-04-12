'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, RefreshCw, AlertTriangle } from 'lucide-react';

type Step3Phase = 'waiting' | 'fetching' | 'connecting' | 'done' | 'error';

interface PageResult {
  id: string;
  name: string;
  status: 'pending' | 'connecting' | 'done' | 'error';
}

export function MetaConnectWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [step3Phase, setStep3Phase] = useState<Step3Phase>('waiting');
  const [pageResults, setPageResults] = useState<PageResult[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [orgId, setOrgId] = useState('');

  // Step 3: auto-run when arriving at step 3
  useEffect(() => {
    if (step !== 3) return;
    runStep3();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function runStep3() {
    setStep3Phase('fetching');

    // Fetch pending pages from DB session
    let pages: { id: string; name: string }[] = [];
    let fetchedOrgId = '';

    // Retry up to 3 times (session may not be ready immediately)
    const delays = [400, 900, 1800];
    for (let i = 0; i < delays.length; i++) {
      await new Promise((r) => setTimeout(r, delays[i]));
      try {
        const res = await fetch('/api/integrations/meta/pending-pages');
        const data = await res.json() as { pages?: { id: string; name: string }[]; orgId?: string; error?: string };
        if (data.pages && data.pages.length > 0) {
          pages = data.pages;
          fetchedOrgId = data.orgId || '';
          break;
        }
      } catch { /* retry */ }
    }

    if (!pages.length) {
      setStep3Phase('error');
      setErrorMsg('Sayfalar yüklenemedi. Lütfen tekrar deneyin.');
      return;
    }

    setOrgId(fetchedOrgId);
    setPageResults(pages.map((p) => ({ ...p, status: 'pending' })));
    setStep3Phase('connecting');

    // Connect each page sequentially
    const results = [...pages.map((p) => ({ ...p, status: 'pending' as const }))];
    for (let i = 0; i < pages.length; i++) {
      results[i] = { ...results[i], status: 'connecting' };
      setPageResults([...results]);

      try {
        const res = await fetch('/api/integrations/meta/select-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ org_id: fetchedOrgId, page_id: pages[i].id }),
        });
        const json = await res.json() as { success: boolean; error?: string };
        results[i] = { ...results[i], status: json.success ? 'done' : 'error' };
      } catch {
        results[i] = { ...results[i], status: 'error' };
      }
      setPageResults([...results]);
    }

    const anySuccess = results.some((r) => r.status === 'done');
    if (anySuccess) {
      setStep3Phase('done');
      // Auto-advance to success
      setTimeout(() => setStep(4), 1000);
    } else {
      setStep3Phase('error');
      setErrorMsg('Hiçbir sayfa bağlanamadı. Lütfen tekrar deneyin.');
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Progress bar */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2, 3, 4].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                step > num
                  ? 'bg-green-500 text-white'
                  : step === num
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-400'
              }`}>
                {step > num ? <Check className="h-4 w-4" /> : num}
              </div>
              {num < 4 && (
                <div className={`h-1 w-12 transition-colors ${step > num ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          {/* ── Step 1: Welcome ──────────────────────────────── */}
          {step === 1 && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600">
                <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Meta Lead Ads'ı Bağla</h2>
              <p className="mb-8 text-sm text-gray-500">
                Facebook sayfalarınızdan gelen lead formlarını otomatik olarak Voice Agent CRM'e aktarın.
              </p>
              <ul className="mb-8 space-y-3 text-left">
                {[
                  'Reklam formlarından gelen lead\'leri otomatik yakala',
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
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Başla
              </button>
            </div>
          )}

          {/* ── Step 2: Connect ───────────────────────────────── */}
          {step === 2 && (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">Meta ile Bağlan</h2>
              <p className="mb-6 text-sm text-gray-500">
                Meta hesabınıza giriş yapın ve gerekli izinleri verin. Meta'nın kendi ekranında hangi sayfaları bağlamak istediğinizi seçeceksiniz.
              </p>
              <div className="mb-8 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">İstenen İzinler</p>
                {[
                  'Facebook sayfalarınızı listele',
                  'Lead form verilerini oku',
                  'Sayfa webhook aboneliği yönet',
                ].map((perm) => (
                  <div key={perm} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-sm text-gray-600">{perm}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-[#1877F2] px-6 py-3 font-semibold text-white hover:bg-[#166fe5] transition-colors"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                Meta ile Bağlan
              </button>
              <button
                onClick={() => router.push('/dashboard/integrations')}
                className="mt-3 w-full rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                İptal
              </button>
            </div>
          )}

          {/* ── Step 3: Processing ───────────────────────────── */}
          {step === 3 && (
            <div>
              <div className="mb-6 text-center">
                {(step3Phase === 'waiting' || step3Phase === 'fetching') && (
                  <RefreshCw className="mx-auto h-10 w-10 animate-spin text-indigo-600 mb-3" />
                )}
                {(step3Phase === 'connecting' || step3Phase === 'done') && (
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                    <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
                  </div>
                )}
                {step3Phase === 'error' && (
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                )}
                <h2 className="text-xl font-bold text-gray-900">
                  {step3Phase === 'waiting' || step3Phase === 'fetching' ? 'Sayfalar Hazırlanıyor...' :
                   step3Phase === 'connecting' ? 'Sayfalar Bağlanıyor...' :
                   step3Phase === 'done' ? 'Tamamlandı!' :
                   'Hata Oluştu'}
                </h2>
                {step3Phase === 'error' && (
                  <p className="mt-2 text-sm text-red-500">{errorMsg}</p>
                )}
              </div>

              {/* Page progress list */}
              {pageResults.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {pageResults.map((page) => (
                    <div key={page.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${
                      page.status === 'done' ? 'bg-green-50' :
                      page.status === 'error' ? 'bg-red-50' :
                      page.status === 'connecting' ? 'bg-indigo-50' : 'bg-gray-50'
                    }`}>
                      <div className="shrink-0">
                        {page.status === 'done' && <Check className="h-4 w-4 text-green-600" />}
                        {page.status === 'error' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        {page.status === 'connecting' && <RefreshCw className="h-4 w-4 text-indigo-600 animate-spin" />}
                        {page.status === 'pending' && <span className="inline-block h-4 w-4 rounded-full border-2 border-gray-300" />}
                      </div>
                      <span className="flex-1 text-sm font-medium text-gray-700 truncate">{page.name}</span>
                      <span className="text-xs text-gray-400">
                        {page.status === 'done' ? 'Bağlandı' :
                         page.status === 'error' ? 'Hata' :
                         page.status === 'connecting' ? 'Bağlanıyor...' : 'Bekliyor'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {step3Phase === 'error' && (
                <button
                  onClick={() => { window.location.href = '/api/integrations/meta/connect'; }}
                  className="mt-6 w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  Tekrar Dene
                </button>
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
                Meta sayfalarınız başarıyla bağlandı. Lead formlarından gelen veriler artık CRM'e otomatik olarak aktarılacak.
              </p>
              {pageResults.filter(r => r.status === 'done').length > 0 && (
                <p className="mb-6 text-sm font-semibold text-green-600">
                  {pageResults.filter(r => r.status === 'done').length} sayfa bağlandı
                </p>
              )}
              <button
                onClick={() => router.push('/dashboard/integrations?meta_connected=1')}
                className="w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 transition-colors"
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
