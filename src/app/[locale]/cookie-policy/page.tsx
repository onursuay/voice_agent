import type { Metadata } from 'next';
import CookiePolicyTR from '@/components/legal/CookiePolicyTR';
import CookiePolicyEN from '@/components/legal/CookiePolicyEN';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en'
    ? {
        title: 'Cookie Policy - VoiceAgent by Yo Dijital',
        description: 'Cookie Policy for VoiceAgent by Yo Dijital.',
      }
    : {
        title: 'Çerez Politikası - VoiceAgent by Yo Dijital',
        description: 'VoiceAgent Çerez Politikası.',
      };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <CookiePolicyEN /> : <CookiePolicyTR />;
}
