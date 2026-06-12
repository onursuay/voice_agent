import type { InboxChannel } from '@/lib/types';

/* ── Kanal marka ikonları (lucide brand ikonu içermediği için inline SVG) ── */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0C5.24 0 0 4.955 0 11.64c0 3.497 1.434 6.518 3.768 8.604a.96.96 0 01.322.68l.065 2.135a.96.96 0 001.347.85l2.382-1.053a.96.96 0 01.641-.046A13.06 13.06 0 0012 24c6.76 0 12-4.955 12-11.64S18.76 0 12 0zm7.2 8.93l-3.522 5.59a1.8 1.8 0 01-2.604.48l-2.802-2.1a.72.72 0 00-.867 0l-3.78 2.87c-.504.382-1.163-.222-.823-.755l3.522-5.59a1.8 1.8 0 012.604-.48l2.802 2.1a.72.72 0 00.867 0l3.78-2.87c.504-.382 1.163.222.823.755z" />
    </svg>
  );
}

export function LeadFormIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export interface ChannelVisual {
  Icon: (props: { className?: string }) => React.JSX.Element;
  // İkon rozeti (dolu) için arka plan
  badge: string;
  // Yumuşak etiket (chip) sınıfları
  soft: string;
  // Aktif/aksan rengi (nokta, kenarlık)
  dot: string;
  ring: string;
}

export const CHANNEL_VISUAL: Record<InboxChannel, ChannelVisual> = {
  whatsapp: {
    Icon: WhatsAppIcon,
    badge: 'bg-[#25D366] text-white',
    soft: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    dot: 'bg-[#25D366]',
    ring: 'ring-[#25D366]/30',
  },
  instagram: {
    Icon: InstagramIcon,
    badge: 'bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white',
    soft: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    dot: 'bg-[#d62976]',
    ring: 'ring-[#d62976]/30',
  },
  messenger: {
    Icon: MessengerIcon,
    badge: 'bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white',
    soft: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
    dot: 'bg-[#0084FF]',
    ring: 'ring-[#0084FF]/30',
  },
  lead_form: {
    Icon: LeadFormIcon,
    badge: 'bg-amber-500 text-white',
    soft: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    dot: 'bg-amber-500',
    ring: 'ring-amber-400/30',
  },
};

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-700',
  open: 'bg-sky-100 text-sky-700',
  pending: 'bg-amber-100 text-amber-700',
  resolved: 'bg-gray-100 text-gray-500',
  snoozed: 'bg-violet-100 text-violet-700',
};

export function statusStyle(status: string): string {
  return STATUS_STYLE[status] || 'bg-gray-100 text-gray-600';
}
