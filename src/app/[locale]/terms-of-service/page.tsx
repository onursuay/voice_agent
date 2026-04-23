import type { Metadata } from 'next';
import TermsOfServiceTR from '@/components/legal/TermsOfServiceTR';
import TermsOfServiceEN from '@/components/legal/TermsOfServiceEN';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en'
    ? {
        title: 'Terms of Service - VoiceAgent by Yo Dijital',
        description: 'Terms of Service for VoiceAgent by Yo Dijital.',
      }
    : {
        title: 'Kullanım Koşulları - VoiceAgent by Yo Dijital',
        description: 'VoiceAgent Kullanım Koşulları.',
      };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <TermsOfServiceEN /> : <TermsOfServiceTR />;
}
