# SOMNEA Viral Landing Page

Tek sayfalık, mobil öncelikli, Netlify'ya doğrudan yayınlanabilir satış sayfası.

## 1) En hızlı yayınlama
1. Bu klasörü GitHub'a gönder veya Netlify'da **Deploy manually** ile ZIP'i yükle.
2. `netlify.toml` kökte hazırdır; build gerekmez.
3. Netlify > Domain management bölümünden domaini bağla.
4. Siparişler Netlify **Forms > somnea-order** altında görünür.

## 2) Gerçek yorumları ekleme
`data/reviews.json` içindeki 25 hazır slotu gerçek yorumlarla doldur.
- `published: true` yap.
- `rating`: 1-5.
- Fotoğraf varsa `assets/images/reviews/` içine koy ve `image` yolunu güncelle.
- Ortalama puan site tarafından otomatik hesaplanır. Gerçek veri olmadan 4,9 gösterilmez.

## 3) Gerçek müşteri/UGC fotoğrafları
`assets/images/ugc/` klasörüne görselleri koy.
`data/ugc.json` içindeki ilgili kaydı `published:true` yap ve dosya yolunu değiştir.

## 4) Türkiye il-ilçe-mahalle
`data/turkey_locations.json` dosyasını elindeki tam JSON ile değiştirebilirsin.
Desteklenen yapı:
```json
{
  "İzmir": {
    "Narlıdere": ["Çamtepe", "Ilıca"]
  }
}
```
Ayrıca PTT birleşik JSON dizisi yapısı da desteklenir. Yerel dosya eksikse tarayıcı, config.js'teki açık kaynak PTT verisine fallback dener.

## 5) Sosyal bağlantılar / fiyatlar
`assets/js/config.js` dosyasından:
- Instagram
- Facebook
- WhatsApp
- fiyatlar
ayarlanır.

## 6) Ürün görseli
Ana ürün: `assets/images/product/somnea-sleep-reset.jpg`
Logo: `assets/images/brand/somnea-logo.png`
Kapak: `assets/images/brand/somnea-cover.png`

## 7) Sağlık iddiaları
Sayfa bilerek "kesin uyutur", "alerjen içermez", "tedavi eder" gibi doğrulanmamış iddiaları kullanmaz. Elinizde resmi ürün/İÇERİK dokümanı varsa metinleri o belgelere göre güncelleyin.
