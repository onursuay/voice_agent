import type { Metadata } from 'next';
import PrivacyPolicyTR from '@/components/legal/PrivacyPolicyTR';
import PrivacyPolicyEN from '@/components/legal/PrivacyPolicyEN';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return locale === 'en'
    ? {
        title: 'Privacy Policy - DijiGrow',
        description:
          'Privacy Policy for DijiGrow (dijigrow.com). Learn how we collect, use, and protect your data, including our use of Google API Services.',
      }
    : {
        title: 'Gizlilik Politikası - DijiGrow',
        description:
          'DijiGrow Gizlilik Politikası. Verilerinizi nasıl topladığımız, kullandığımız ve koruduğumuzu hakkında bilgi edinin.',
      };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return locale === 'en' ? <PrivacyPolicyEN /> : <PrivacyPolicyTR />;
}
