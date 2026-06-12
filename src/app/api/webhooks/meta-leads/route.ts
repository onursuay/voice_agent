// Geriye dönük uyumluluk: Meta'da yapılandırılmış mevcut webhook URL'i
// (/api/webhooks/meta-leads) artık birleşik dispatcher'a delege eder.
// Lead Ads (leadgen) + messaging (WhatsApp/Instagram/Messenger) aynı işleyiciden geçer.
export { GET, POST, runtime, dynamic } from '@/app/api/webhooks/meta/route';
