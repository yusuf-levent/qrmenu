# QR Menu

Yerelde calisan QR menu, siparis, mock odeme, isletme paneli ve Expo mobil iskeleti.

Calisma klasoru:

```text
C:\Users\Yusuf\Desktop\qrmenu
```

## Icerik

- `apps/api`: NestJS + Prisma + PostgreSQL API
- `apps/web`: Next.js musteri menusu + isletme paneli + PWA
- `apps/mobile`: Expo mobil iskelet
- `packages/types`: ortak TypeScript tipleri, Zod semalari ve para/split/status yardimcilari
- `packages/config`: ortak TypeScript yapilandirmasi

## Gereksinimler

- Node.js 20.9 veya uzeri
- Docker Desktop
- pnpm 10

Bu makinede pnpm global calismiyorsa komutlari `corepack pnpm ...` olarak calistir.

## Tek Komutla Yerelde Acma

Windows PowerShell:

```powershell
cd C:\Users\Yusuf\Desktop\qrmenu
.\scripts\start-local.ps1
```

Bu komut Postgres'i acar, migration/seed calistirir ve API + web + mobile dev sunucularini baslatir.

## Manuel Kurulum

```powershell
cd C:\Users\Yusuf\Desktop\qrmenu
corepack pnpm install
docker compose up -d
corepack pnpm --filter api prisma migrate dev
corepack pnpm --filter api prisma db seed
corepack pnpm dev
```

Kontrol:

```powershell
.\scripts\verify-local.ps1
```

Durdurma:

```powershell
.\scripts\stop-local.ps1
```

Varsayilan adresler:

- API: `http://localhost:4000`
- Web: `http://localhost:3001`
- Expo: terminalde cikan Expo adresi

Panel demo hesabi:

- E-posta: `owner@testkafe.local`
- Sifre: `Test12345!`

## Nasil Denenir

1. `http://localhost:3001/m/test-kafe` adresini ac.
2. Bir veya birkac urun ekle, `Sepete git` butonuna bas.
3. Siparis tipini sec, `Siparisi onayla` ile odeme ekranina gec.
4. Urun videosu olan kartta oynat simgesine basarak tam ekran video oynaticiyi kontrol et.
5. `Tek ode`, `Esit bol` veya `Kalem ata` secenekleriyle mock odeme yap.
6. `Siparisi takip et` baglantisiyla canli takip ekranini gor.
7. Ayri sekmede `http://localhost:3001/panel/login` adresine gir.
8. Demo hesapla oturum ac, `Canli Siparisler` ekraninda siparisi sonraki durumlara gecir.
9. Yeni siparis geldiginde paneldeki gorsel uyariyi ve sesli bildirimi kontrol et.
10. `Masalar & QR` ekraninda QR PNG goruntule, indir, yazdir veya masa sil.
11. `Menu Yonetimi` ekraninda kategori ekle/duzenle/sirala/sil; urun ekle/duzenle, fotograf yukle, stok ac/kapat veya urun sil.
12. `Rapor` ekraninda gunluk/haftalik ozet ve en cok satan urun grafigini gor.

## Guvenlik Kontrol Listesi

- Kimlik/Yetki: JWT httpOnly cookie, panel uclarinda auth guard ve `businessId` sahiplik kontrolu.
- Sifre: bcrypt 12 round, duz metin sifre saklanmaz.
- Girdi dogrulama: paylasilan Zod semalari API uclarinda kullanilir.
- SQL/Injection: Prisma kullanilir, ham SQL string birlestirme yok.
- Rate limiting: global Nest throttler aktif.
- Dosya yukleme: sadece resim MIME tipi, 5 MB limit, sanitize edilmis dosya adi.
- CORS: `.env` icindeki bilinen web origin ile sinirli, `*` kullanilmaz.
- Sirlar: `.env.example` var, gercek `.env` ignore edilir.
- Guvenlik basliklari: helmet aktif.
- Odeme: mock provider arkasinda, split toplami sunucuda dogrulanir.
- Para: kurus integer olarak saklanir, siparis toplami sunucudaki menu fiyatindan hesaplanir.
- Hata mesaji: istemciye stack trace donulmez.

## Test ve Kontrol

```powershell
corepack pnpm build
corepack pnpm lint
corepack pnpm test
corepack pnpm e2e
```

Not: Windows'ta Prisma dosya kilidi olmamasi icin build/test oncesi calisan dev sunucularini kapatmak daha sagliklidir.

## Varsayimlar

- Ana teslim klasoru `C:\Users\Yusuf\Desktop\qrmenu` olarak ayarlandi.
- Rapor ekrani icin panelin ihtiyac duydugu `/reports/summary` API ucu eklendi.
- Mobil app siparis/odeme akislarini tekrar yazmaz; promptta istendigi gibi menu, sadakat ve kesfet iskeletini tasir.
- Mock odeme cagrida aninda `PAID` doner.
