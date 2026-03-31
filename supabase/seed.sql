-- ============================================
-- YO DIJITAL - Seed Data
-- Realistic Turkish CRM sample data
-- ============================================

-- Static UUIDs for referencing
-- Org:    00000000-0000-0000-0000-000000000001
-- Stages: 00000000-0000-0000-0000-0000000000a1 .. a7
-- Leads:  00000000-0000-0000-0000-000000000101 .. 0119

-- ============================================
-- 1. ORGANIZATION
-- ============================================
INSERT INTO organizations (id, name, slug, logo_url, settings) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Yo Dijital', 'yo-dijital', NULL, '{"timezone": "Europe/Istanbul", "currency": "TRY"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 2. CRM STAGES (trigger creates defaults, but we insert explicitly with known IDs)
-- ============================================
DELETE FROM crm_stages WHERE organization_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO crm_stages (id, organization_id, name, slug, color, position, is_won, is_lost) VALUES
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'Yeni',                'new',       '#6366f1', 0, false, false),
  ('00000000-0000-0000-0000-0000000000a2', '00000000-0000-0000-0000-000000000001', 'Iletisime Gecildi',   'contacted', '#3b82f6', 1, false, false),
  ('00000000-0000-0000-0000-0000000000a3', '00000000-0000-0000-0000-000000000001', 'Nitelikli',           'qualified', '#8b5cf6', 2, false, false),
  ('00000000-0000-0000-0000-0000000000a4', '00000000-0000-0000-0000-000000000001', 'Toplanti',            'meeting',   '#f59e0b', 3, false, false),
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-000000000001', 'Teklif',              'offer',     '#f97316', 4, false, false),
  ('00000000-0000-0000-0000-0000000000a6', '00000000-0000-0000-0000-000000000001', 'Kazanildi',           'won',       '#22c55e', 5, true,  false),
  ('00000000-0000-0000-0000-0000000000a7', '00000000-0000-0000-0000-000000000001', 'Kaybedildi',          'lost',      '#ef4444', 6, false, true);

-- ============================================
-- 3. LEADS (25 realistic Turkish leads)
-- ============================================
INSERT INTO leads (id, organization_id, phone, email, first_name, last_name, full_name, company, job_title, city, country, stage_id, assigned_to, score, source_platform, campaign_name, tags, custom_fields, notes_count, activities_count, created_at) VALUES

-- Yeni (5)
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
 '+905321234501', 'ahmet.yilmaz@teknosoft.com.tr', 'Ahmet', 'Yilmaz', 'Ahmet Yilmaz',
 'TeknoSoft Yazilim', 'Genel Mudur', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a1', NULL, 45, 'meta_lead_form', 'Instagram Kampanya Q1',
 '{"sicak","demo-istedi"}', '{"sektor": "yazilim"}', 1, 2, now() - interval '2 days'),

('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001',
 '+905451234502', 'elif.kara@modaevi.com', 'Elif', 'Kara', 'Elif Kara',
 'ModaEvi Tekstil', 'Pazarlama Muduru', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a1', NULL, 30, 'instagram_dm', 'Instagram Kampanya Q1',
 '{"soguk"}', '{}', 0, 1, now() - interval '1 day'),

('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001',
 '+905531234503', 'murat.demir@anadoluinsaat.com.tr', 'Murat', 'Demir', 'Murat Demir',
 'Anadolu Insaat', 'Satis Direktoru', 'Ankara', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a1', NULL, 20, 'website', NULL,
 '{"soguk"}', '{}', 0, 1, now() - interval '6 hours'),

('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000001',
 '+905361234504', 'zeynep.ozturk@saglikplus.com', 'Zeynep', 'Ozturk', 'Zeynep Ozturk',
 'SaglikPlus Medikal', 'Operasyon Muduru', 'Izmir', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a1', NULL, 55, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"sicak","VIP"}', '{"sektor": "saglik"}', 0, 1, now() - interval '3 hours'),

('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001',
 '+905421234505', 'can.aksoy@dijitalajans.com', 'Can', 'Aksoy', 'Can Aksoy',
 'Dijital Ajans Co.', 'Kurucu Ortak', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a1', NULL, 70, 'whatsapp', 'WhatsApp Broadcast',
 '{"sicak","demo-istedi","VIP"}', '{"sektor": "pazarlama"}', 1, 2, now() - interval '12 hours'),

-- Iletisime Gecildi (5)
('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001',
 '+905551234506', 'selin.aydin@gastropark.com.tr', 'Selin', 'Aydin', 'Selin Aydin',
 'GastroPark Restoran Grubu', 'Isletme Muduru', 'Antalya', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a2', NULL, 40, 'messenger', 'Instagram Kampanya Q1',
 '{"geri-aranacak"}', '{}', 1, 3, now() - interval '4 days'),

('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000001',
 '+905071234507', 'burak.celik@otomax.com.tr', 'Burak', 'Celik', 'Burak Celik',
 'OtoMax Otomotiv', 'Satis Muduru', 'Bursa', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a2', NULL, 60, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"sicak","geri-aranacak"}', '{"sektor": "otomotiv"}', 0, 2, now() - interval '5 days'),

('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001',
 '+905381234508', 'ayse.sahin@fintek.io', 'Ayse', 'Sahin', 'Ayse Sahin',
 'FinTek Yazilim', 'CTO', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a2', NULL, 85, 'website', NULL,
 '{"VIP","demo-istedi"}', '{"sektor": "finans"}', 2, 4, now() - interval '3 days'),

('00000000-0000-0000-0000-000000000109', '00000000-0000-0000-0000-000000000001',
 '+905441234509', 'emre.koc@koclar-insaat.com', 'Emre', 'Koc', 'Emre Koc',
 'Koclar Insaat', 'Proje Muduru', 'Ankara', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a2', NULL, 35, 'instagram_dm', 'Instagram Kampanya Q1',
 '{"soguk"}', '{}', 0, 2, now() - interval '6 days'),

('00000000-0000-0000-0000-000000000110', '00000000-0000-0000-0000-000000000001',
 '+905301234510', 'deniz.arslan@egitimhub.com', 'Deniz', 'Arslan', 'Deniz Arslan',
 'EgitimHub Online', 'Genel Koordinator', 'Izmir', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a2', NULL, 50, 'whatsapp', 'WhatsApp Broadcast',
 '{"geri-aranacak"}', '{"sektor": "egitim"}', 1, 3, now() - interval '7 days'),

-- Nitelikli (4)
('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001',
 '+905461234511', 'mehmet.tekin@bulutsis.com', 'Mehmet', 'Tekin', 'Mehmet Tekin',
 'BulutSis Teknoloji', 'CEO', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a3', NULL, 90, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"VIP","sicak","demo-istedi"}', '{"sektor": "teknoloji", "butce": "50000+"}', 3, 5, now() - interval '10 days'),

('00000000-0000-0000-0000-000000000112', '00000000-0000-0000-0000-000000000001',
 '+905521234512', 'pinar.erdogan@guzellikmarket.com', 'Pinar', 'Erdogan', 'Pinar Erdogan',
 'GuzellikMarket', 'E-ticaret Muduru', 'Ankara', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a3', NULL, 65, 'whatsapp', 'WhatsApp Broadcast',
 '{"sicak"}', '{"sektor": "kozmetik"}', 1, 3, now() - interval '8 days'),

('00000000-0000-0000-0000-000000000113', '00000000-0000-0000-0000-000000000001',
 '+905341234513', 'ozan.yildiz@tasinmaz360.com', 'Ozan', 'Yildiz', 'Ozan Yildiz',
 'Tasinmaz360', 'Kurucu', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a3', NULL, 75, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"VIP","demo-istedi"}', '{"sektor": "gayrimenkul"}', 2, 4, now() - interval '12 days'),

('00000000-0000-0000-0000-000000000114', '00000000-0000-0000-0000-000000000001',
 '+905491234514', 'gizem.polat@lojistikpro.com.tr', 'Gizem', 'Polat', 'Gizem Polat',
 'LojistikPro', 'Operasyon Direktoru', 'Bursa', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a3', NULL, 80, 'messenger', 'Instagram Kampanya Q1',
 '{"sicak","geri-aranacak"}', '{"sektor": "lojistik"}', 1, 4, now() - interval '9 days'),

-- Toplanti (3)
('00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000001',
 '+905411234515', 'kerem.ozdemir@smartfarm.com.tr', 'Kerem', 'Ozdemir', 'Kerem Ozdemir',
 'SmartFarm Tarim', 'Genel Mudur', 'Antalya', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a4', NULL, 88, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"VIP","sicak"}', '{"sektor": "tarim", "butce": "30000+"}', 2, 6, now() - interval '14 days'),

('00000000-0000-0000-0000-000000000116', '00000000-0000-0000-0000-000000000001',
 '+905371234516', 'canan.kurt@hotelzen.com', 'Canan', 'Kurt', 'Canan Kurt',
 'HotelZen Otelcilik', 'Pazarlama Direktoru', 'Antalya', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a4', NULL, 72, 'website', NULL,
 '{"demo-istedi"}', '{"sektor": "turizm"}', 1, 5, now() - interval '11 days'),

('00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000001',
 '+905501234517', 'hakan.bal@entegrasyon.io', 'Hakan', 'Bal', 'Hakan Bal',
 'Entegrasyon.io', 'CTO', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a4', NULL, 92, 'instagram_dm', 'Instagram Kampanya Q1',
 '{"VIP","sicak","demo-istedi"}', '{"sektor": "teknoloji", "butce": "75000+"}', 3, 7, now() - interval '15 days'),

-- Teklif (3)
('00000000-0000-0000-0000-000000000118', '00000000-0000-0000-0000-000000000001',
 '+905331234518', 'sevgi.atas@perakendeci.com', 'Sevgi', 'Atas', 'Sevgi Atas',
 'Perakendeci A.S.', 'Satin Alma Muduru', 'Izmir', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a5', NULL, 82, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"VIP"}', '{"sektor": "perakende", "butce": "40000+"}', 2, 6, now() - interval '18 days'),

('00000000-0000-0000-0000-000000000119', '00000000-0000-0000-0000-000000000001',
 '+905471234519', 'ali.dogan@doganendustri.com.tr', 'Ali', 'Dogan', 'Ali Dogan',
 'Dogan Endustri', 'Fabrika Muduru', 'Bursa', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a5', NULL, 78, 'whatsapp', 'WhatsApp Broadcast',
 '{"sicak","geri-aranacak"}', '{"sektor": "uretim"}', 1, 5, now() - interval '20 days'),

('00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001',
 '+905391234520', 'ece.tuncer@dijitalsaglik.com', 'Ece', 'Tuncer', 'Ece Tuncer',
 'Dijital Saglik A.S.', 'CEO', 'Ankara', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a5', NULL, 95, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"VIP","sicak","demo-istedi"}', '{"sektor": "saglik-teknoloji", "butce": "100000+"}', 3, 8, now() - interval '22 days'),

-- Kazanildi (3)
('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001',
 '+905481234521', 'tolga.erdem@akilliofis.com', 'Tolga', 'Erdem', 'Tolga Erdem',
 'AkilliOfis Teknoloji', 'Kurucu', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a6', NULL, 90, 'meta_lead_form', 'Meta Lead Gen Mart',
 '{"VIP"}', '{"sektor": "teknoloji", "satis_tutari": "45000"}', 2, 10, now() - interval '30 days'),

('00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000001',
 '+905351234522', 'nurgul.kaya@hizlimarket.com', 'Nurgul', 'Kaya', 'Nurgul Kaya',
 'HizliMarket', 'E-ticaret Direktoru', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a6', NULL, 85, 'whatsapp', 'WhatsApp Broadcast',
 '{"VIP"}', '{"sektor": "e-ticaret", "satis_tutari": "28000"}', 1, 8, now() - interval '25 days'),

('00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000001',
 '+905401234523', 'baris.yalcin@enerjiplus.com.tr', 'Baris', 'Yalcin', 'Baris Yalcin',
 'EnerjiPlus', 'Genel Mudur Yardimcisi', 'Ankara', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a6', NULL, 88, 'website', NULL,
 '{"VIP"}', '{"sektor": "enerji", "satis_tutari": "62000"}', 2, 9, now() - interval '28 days'),

-- Kaybedildi (2)
('00000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-000000000001',
 '+905311234524', 'merve.aslan@temizlik365.com', 'Merve', 'Aslan', 'Merve Aslan',
 'Temizlik365', 'Isletme Sahibi', 'Izmir', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a7', NULL, 15, 'instagram_dm', 'Instagram Kampanya Q1',
 '{"soguk"}', '{"kayip_neden": "butce yetersiz"}', 0, 4, now() - interval '21 days'),

('00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000001',
 '+905561234525', 'omer.gunes@kargohiz.com', 'Omer', 'Gunes', 'Omer Gunes',
 'KargoHiz Lojistik', 'Operasyon Muduru', 'Istanbul', 'Turkiye',
 '00000000-0000-0000-0000-0000000000a7', NULL, 10, 'messenger', 'Instagram Kampanya Q1',
 '{"soguk"}', '{"kayip_neden": "rakip tercih edildi"}', 1, 5, now() - interval '19 days');

-- ============================================
-- 4. LEAD ACTIVITIES (15 activities)
-- ============================================
INSERT INTO lead_activities (id, lead_id, organization_id, user_id, activity_type, title, description, metadata, created_at) VALUES

('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
 NULL, 'created', 'Lead olusturuldu', 'Meta Lead Form uzerinden geldi', '{"source": "meta_lead_form"}', now() - interval '2 days'),

('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
 NULL, 'tag_added', 'Etiket eklendi: sicak', NULL, '{"tag": "sicak"}', now() - interval '2 days' + interval '1 hour'),

('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001',
 NULL, 'created', 'Lead olusturuldu', 'WhatsApp uzerinden geldi', '{"source": "whatsapp"}', now() - interval '12 hours'),

('00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000001',
 NULL, 'score_changed', 'Skor guncellendi: 70', 'Skor 0 -> 70 olarak degistirildi', '{"old_score": 0, "new_score": 70}', now() - interval '11 hours'),

('00000000-0000-0000-0000-000000000205', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Yeni -> Iletisime Gecildi', NULL,
 '{"from_stage": "new", "to_stage": "contacted"}', now() - interval '2 days'),

('00000000-0000-0000-0000-000000000206', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001',
 NULL, 'call_made', 'Arama yapildi', '5 dakika gorusme gerceklesti, demo talebi alindi', '{"duration": 300}', now() - interval '2 days' + interval '2 hours'),

('00000000-0000-0000-0000-000000000207', '00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000001',
 NULL, 'email_sent', 'E-posta gonderildi', 'Sunum dosyasi ve fiyat listesi gonderildi', '{"subject": "Yo Dijital - Cozum Sunumu"}', now() - interval '1 day'),

('00000000-0000-0000-0000-000000000208', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Iletisime Gecildi -> Nitelikli', NULL,
 '{"from_stage": "contacted", "to_stage": "qualified"}', now() - interval '7 days'),

('00000000-0000-0000-0000-000000000209', '00000000-0000-0000-0000-000000000115', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Nitelikli -> Toplanti', NULL,
 '{"from_stage": "qualified", "to_stage": "meeting"}', now() - interval '10 days'),

('00000000-0000-0000-0000-000000000210', '00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000001',
 NULL, 'note_added', 'Not eklendi', 'CTO ile teknik toplanti yapildi, API entegrasyonu konusuldu', '{}', now() - interval '13 days'),

('00000000-0000-0000-0000-000000000211', '00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Toplanti -> Teklif', NULL,
 '{"from_stage": "meeting", "to_stage": "offer"}', now() - interval '18 days'),

('00000000-0000-0000-0000-000000000212', '00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Teklif -> Kazanildi', NULL,
 '{"from_stage": "offer", "to_stage": "won"}', now() - interval '25 days'),

('00000000-0000-0000-0000-000000000213', '00000000-0000-0000-0000-000000000124', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Teklif -> Kaybedildi', 'Butce yetersizligi nedeniyle vazgecildi',
 '{"from_stage": "offer", "to_stage": "lost"}', now() - interval '18 days'),

('00000000-0000-0000-0000-000000000214', '00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000001',
 NULL, 'call_made', 'Arama yapildi', 'Mesaj birakildi, geri donus bekleniyor', '{"duration": 45}', now() - interval '3 days'),

('00000000-0000-0000-0000-000000000215', '00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000001',
 NULL, 'stage_change', 'Asama degistirildi: Teklif -> Kazanildi', 'Sozlesme imzalandi',
 '{"from_stage": "offer", "to_stage": "won"}', now() - interval '20 days');

-- ============================================
-- 5. LEAD NOTES (5 notes)
-- ============================================
INSERT INTO lead_notes (id, lead_id, organization_id, user_id, content, is_system, created_at) VALUES

('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001',
 NULL, 'Ahmet Bey ile ilk gorusme yapildi. Yazilim cozumleri hakkinda bilgi istedi, ozellikle CRM entegrasyonu sorusunu yoneltti. Haftaya demo icin gun belirlenecek.', false, now() - interval '1 day'),

('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000001',
 NULL, 'BulutSis icin ozel fiyat teklifi hazirlandi. 50+ kullanici lisansi talep ediyorlar. Yillik anlasmaya sicak bakiyorlar.', false, now() - interval '8 days'),

('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000117', '00000000-0000-0000-0000-000000000001',
 NULL, 'Hakan Bey teknik ekibiyle beraber demo istedi. API dokumantasyonu paylasild. Entegrasyon sureci hakkinda detayli bilgi verildi.', false, now() - interval '13 days'),

('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000120', '00000000-0000-0000-0000-000000000001',
 NULL, 'Ece Hanim ile CEO toplantisi yapildi. Tam paket cozum istiyorlar: CRM + WhatsApp + Otomasyon. Butce onay sureci baslatildi.', false, now() - interval '20 days'),

('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000125', '00000000-0000-0000-0000-000000000001',
 NULL, 'Omer Bey rakip firmadan teklif almis. Fiyat farki %20 civarinda. Ek indirim yapildi ama tercihlerini degistiremedik.', true, now() - interval '17 days');

-- ============================================
-- 6. LEAD SOURCES (3 raw source records)
-- ============================================
INSERT INTO lead_sources (id, organization_id, lead_id, platform, platform_lead_id, campaign_id, campaign_name, form_id, form_name, raw_data, received_at, processed, created_at) VALUES

('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000101', 'meta_lead_form', 'fb_lead_98765', 'camp_ig_q1_2026', 'Instagram Kampanya Q1',
 'form_crm_demo', 'CRM Demo Talep Formu',
 '{"created_time": "2026-03-28T10:30:00+0300", "field_data": [{"name": "full_name", "values": ["Ahmet Yilmaz"]}, {"name": "email", "values": ["ahmet.yilmaz@teknosoft.com.tr"]}, {"name": "phone_number", "values": ["+905321234501"]}, {"name": "company_name", "values": ["TeknoSoft Yazilim"]}, {"name": "city", "values": ["Istanbul"]}], "ad_id": "ad_456", "ad_name": "CRM Demo - Carousel", "adset_id": "adset_789", "adset_name": "IT Sektor - Istanbul"}',
 now() - interval '2 days', true, now() - interval '2 days'),

('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000104', 'meta_lead_form', 'fb_lead_87654', 'camp_meta_mart_2026', 'Meta Lead Gen Mart',
 'form_bilgi_talep', 'Bilgi Talep Formu',
 '{"created_time": "2026-03-30T08:15:00+0300", "field_data": [{"name": "full_name", "values": ["Zeynep Ozturk"]}, {"name": "email", "values": ["zeynep.ozturk@saglikplus.com"]}, {"name": "phone_number", "values": ["+905361234504"]}, {"name": "company_name", "values": ["SaglikPlus Medikal"]}, {"name": "job_title", "values": ["Operasyon Muduru"]}], "ad_id": "ad_321", "ad_name": "Saglik Sektoru Lead Gen", "adset_id": "adset_654", "adset_name": "Saglik - Izmir"}',
 now() - interval '3 hours', true, now() - interval '3 hours'),

('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000001',
 '00000000-0000-0000-0000-000000000105', 'whatsapp', 'wa_conv_76543', NULL, NULL,
 NULL, NULL,
 '{"from": "+905421234505", "message": "Merhaba, CRM cozumunuz hakkinda bilgi almak istiyorum. Dijital ajansimiz icin kapsamli bir araca ihtiyacimiz var.", "timestamp": "2026-03-29T18:00:00+0300", "wa_id": "905421234505", "profile_name": "Can Aksoy"}',
 now() - interval '12 hours', true, now() - interval '12 hours');

-- ============================================
-- Done! 25 leads, 15 activities, 5 notes, 3 sources
-- ============================================
