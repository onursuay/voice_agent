# Yo Dijital — Lead Operasyon Dashboard + CRM
## Ürün Sunum Özeti

---

## 1) AMAÇ & AVANTAJLAR

### Ne yapar?
Meta reklamlarından (Facebook, Instagram, WhatsApp, Messenger) gelen tüm lead'leri tek merkezde toplar, CRM pipeline ile yönetir, e-posta ve AI arama ile aksiyona dönüştürür.

### Hangi sorunu çözer?
- Lead'ler farklı platformlarda dağınık kalıyor → **tek havuzda birleşir**
- Excel/Google Sheets ile takip yapılıyor → **Airtable benzeri profesyonel grid**
- Hangi lead hangi aşamada bilinmiyor → **pipeline ile görsel takip**
- Lead'lere zamanında dönüş yapılamıyor → **otomasyon ve AI arama**
- Aynı kişi farklı kanallardan geliyor → **otomatik dedupe (telefon/email)**

### Avantajlar
| Avantaj | Detay |
|---------|-------|
| Çok kanallı toplama | Meta Lead Form, WhatsApp, Instagram DM, Messenger, Website, Manuel |
| Otomatik dedupe | Aynı kişi farklı kanallardan gelirse tek lead altında birleşir |
| Airtable benzeri grid | Inline edit, filtre, sıralama, bulk action, keyboard navigation |
| CRM Pipeline | Drag-drop Kanban, aşama takibi, stage history |
| CSV/XLSX import | Mevcut verileri kolayca aktarma, kolon eşleştirme |
| E-posta entegrasyonu | Tek/toplu gönderim, şablon sistemi, Resend altyapısı |
| AI arama | Netgsm + ElevenLabs + OpenAI ile otomatik arama, transkript, özet |
| Otomasyon | Kural bazlı: lead gelince ata, hareketsizse hatırlat, skor değişince aksiyon al |
| Rol bazlı erişim | Owner, Admin, Sales Manager, Sales Rep, Analyst, Readonly |
| Çoklu organizasyon | Her müşteri kendi workspace'inde çalışır |

---

## 2) SIDEBAR ALANLARI

| Alan | Ne İşe Yarar? |
|------|---------------|
| **Dashboard** | Genel bakış: toplam lead, haftalık yeni, dönüşüm oranı, aktif pipeline, son lead'ler, pipeline özeti bar grafiği |
| **Lead'ler** | Ana veri havuzu. Airtable benzeri tablo — tüm lead'ler burada listelenir, aranır, filtrelenir, inline düzenlenir, yeni lead eklenir |
| **Pipeline** | Kanban board. Lead'ler aşama bazlı kolonlarda görünür (Yeni → İletişime Geçildi → Nitelikli → Toplantı → Teklif → Kazanıldı/Kaybedildi). Sürükle-bırak ile aşama değiştirilir |
| **İçe Aktar** | CSV/XLSX dosyadan lead yükleme. 4 adımlı wizard: Dosya Yükle → Kolon Eşleştir → Önizle → Sonuç. Mevcut kayıtlarla otomatik merge |
| **E-posta** | E-posta gönderim merkezi. Tek/toplu gönderim, şablon oluşturma, gönderim geçmişi. Resend API ile info@yodijital.com'dan gönderim |
| **Otomasyonlar** | Kural motoru. "Lead oluşturulduğunda → satış ekibine ata", "3 gün hareketsiz → hatırlatıcı gönder", "Skor 80 üstü → VIP etiketi ekle" gibi tetikleyici-aksiyon kuralları |
| **AI Aramalar** | Yapay zeka ile otomatik telefon araması. Lead seç → senaryo yaz → ses profili seç → kuyruğa ekle. Arama sonrası transkript, AI özet, sonuç sınıflandırma (ilgili/ilgisiz/geri aranacak) |
| **Ayarlar** | Organizasyon bilgileri, üye yönetimi, pipeline aşamalarını özelleştirme (renk, sıra, ekleme/silme), profil düzenleme |

---

## 3) MALİYET & KAZANÇ

### Aylık Maliyet (Altyapı)

| Servis | Kullanım | Aylık Maliyet |
|--------|----------|---------------|
| **Supabase** (DB + Auth) | Free tier: 500MB DB, 50K auth users | **$0** (Free) |
| **Supabase** (Pro gerekirse) | 8GB DB, 100K users, günlük backup | **$25/ay** |
| **Vercel** (Hosting) | Free tier: hobby | **$0** (Free) |
| **Vercel** (Pro gerekirse) | Custom domain, analytics | **$20/ay** |
| **Resend** (E-posta) | Free: 100 mail/gün, 3000/ay | **$0** (Free) |
| **Resend** (Pro) | 50K mail/ay | **$20/ay** |
| **Netgsm** (Telefon) | Arama başına ~0.05-0.10 TL/dk | **~200-500 TL/ay** (kullanıma göre) |
| **ElevenLabs** (Ses) | Free: 10K karakter/ay | **$0** (Free) |
| **ElevenLabs** (Starter) | 30K karakter/ay | **$5/ay** |
| **OpenAI** (AI) | GPT-4o-mini: ~$0.15/1M token | **$5-20/ay** (kullanıma göre) |

**Minimum başlangıç: $0/ay** (tüm free tier)
**Orta ölçek: ~$70/ay + ~300 TL telefon** (~$80 toplam)
**Tam kapasite: ~$90/ay + telefon maliyeti**

---

### Revenue Model — SaaS Subscription

#### Pricing

| Plan | Monthly | Annual (per month) | Annual Total | Discount |
|------|---------|-------------------|--------------|----------|
| **Starter** | ₺999/ay | ₺799/ay | ₺9.588/yıl | %20 |
| **Growth** | ₺1.999/ay | ₺1.599/ay | ₺19.188/yıl | %20 |
| **Enterprise** | ₺3.999/ay | ₺3.199/ay | ₺38.388/yıl | %20 |

#### Plan Features

| Feature | Starter | Growth | Enterprise |
|---------|---------|--------|------------|
| Lead limiti | 1.000/ay | 10.000/ay | Sınırsız |
| Kullanıcı | 2 | 10 | Sınırsız |
| E-posta gönderim | 1.000/ay | 10.000/ay | 50.000/ay |
| AI arama | 50 dk/ay | 500 dk/ay | 2.000 dk/ay |
| Otomasyon kuralı | 5 | 25 | Sınırsız |
| CSV import | ✓ | ✓ | ✓ |
| Meta webhook | ✓ | ✓ | ✓ |
| Pipeline | ✓ | ✓ | ✓ |
| Öncelikli destek | ✗ | ✓ | ✓ |
| Özel entegrasyon | ✗ | ✗ | ✓ |

---

### Revenue Projection

#### 10 Customers Scenario

| Scenario | Monthly Revenue | Annual Revenue | Monthly Cost | Monthly Net |
|----------|----------------|----------------|--------------|-------------|
| 10× Starter (aylık) | ₺9.990 | ₺119.880 | ~₺2.500 | **₺7.490** |
| 10× Growth (aylık) | ₺19.990 | ₺239.880 | ~₺4.000 | **₺15.990** |
| 10× Growth (yıllık) | ₺15.990 | ₺191.880 | ~₺4.000 | **₺11.990** |

#### 50 Customers Scenario

| Scenario | Monthly Revenue | Annual Revenue | Monthly Cost | Monthly Net |
|----------|----------------|----------------|--------------|-------------|
| 30 Starter + 15 Growth + 5 Enterprise | ₺79.965 | ₺959.580 | ~₺12.000 | **₺67.965** |
| Aynı mix (yıllık abonelik) | ₺63.965 | ₺767.580 | ~₺12.000 | **₺51.965** |

#### 100 Customers Scenario

| Scenario | Monthly Revenue | Annual Revenue | Monthly Cost | Monthly Net |
|----------|----------------|----------------|--------------|-------------|
| 50 Starter + 35 Growth + 15 Enterprise | ₺179.900 | ₺2.158.800 | ~₺25.000 | **₺154.900** |

---

### Summary

| Metric | Value |
|--------|-------|
| Initial cost | ₺0 (free tier) |
| Monthly net at 10 customers | ~₺7.500 - ₺16.000 |
| Monthly net at 50 customers | ~₺52.000 - ₺68.000 |
| Monthly net at 100 customers | ~₺155.000 |
| Annual subscription benefit | 20% discount for customer, guaranteed revenue for you |
| Break-even | First 3 customers (even Starter plan covers infra cost) |
