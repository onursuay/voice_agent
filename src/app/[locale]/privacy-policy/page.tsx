import type { Metadata } from 'next';
import PrivacyPolicyTR from '@/components/legal/PrivacyPolicyTR';
import PrivacyPolicyEN from '@/components/legal/PrivacyPolicyEN';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en'
    ? {
        title: 'Privacy Policy - VoiceAgent by Yo Dijital',
        description:
          'Privacy Policy for VoiceAgent (voiceagent.yodijital.com). Learn how we collect, use, and protect your data, including our use of Google API Services.',
      }
    : {
        title: 'Gizlilik Politikası - VoiceAgent by Yo Dijital',
        description:
          'VoiceAgent Gizlilik Politikası. Verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuzu hakkında bilgi edinin.',
      };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <PrivacyPolicyEN /> : <PrivacyPolicyTR />;
}
