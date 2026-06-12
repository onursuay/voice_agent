// Geriye dönük uyumluluk: Meta'da yapılandırılmış mevcut webhook URL'i
// (/api/webhooks/meta-leads) artık birleşik dispatcher'a delege eder.
// Lead Ads (leadgen) + messaging (WhatsApp/Instagram/Messenger) aynı işleyiciden geçer.
export { GET, POST } from '@/app/api/webhooks/meta/route';

// Route segment config re-export edilemez — burada doğrudan tanımlanır.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
