# Nihilist Penguen

Nihilist Penguen kart oyununun tek cihazda oynanan dijital sürümü.
Kurulum gerektirmeyen, tarayıcıda çalışan bir web uygulaması.

> **Çoğunluk kaybeder. Cesurlar kazanır.**
> Kazanmak için doğruyu bilmek yetmez; herkesten farklı olman gerekir.

## Nasıl oynanır?

1. **Soru açılır.** Deste karıştırılır, en üstteki kart okunur.
2. **Herkes gizlice seçer.** Cihaz sırayla dolaşır, her oyuncu 1 ya da 2'yi işaretler.
3. **Kartlar aynı anda açılır.** Amaç azınlıkta kalmak; çoğunluktakiler kaybeder.
4. **Puanlama.** Azınlıkta kalan oyuncular, **çoğunlukta kalan oyuncu sayısı kadar** puan kazanır.
   Eşitlik durumunda ya da herkes aynı seçeneği işaretlediğinde kimse puan alamaz.
5. **Kazanan.** Hedef puana ulaşan ilk oyuncu oyunu kazanır.

> **Örnek:** 5 kişilik bir oyunda 2 oyuncu 1'i, 3 oyuncu 2'yi seçtiyse azınlıkta kalan
> 2 oyuncunun her biri 3 puan alır.

- **Oyuncu sayısı:** 3–8
- **Hedef puan:** 10, 15 veya 20
- **Süre:** yaklaşık 15–20 dakika

## Çalıştırma

Derleme adımı ya da bağımlılık yok. `index.html` dosyasını tarayıcıda açmak yeterli:

```bash
open index.html          # macOS
xdg-open index.html      # Linux
```

Telefonda test etmek ya da yerel ağda paylaşmak için basit bir sunucu:

```bash
npx http-server . -p 8080
```

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Ekranların işaretlemesi (kurulum, tur, gizli seçim, açılış, skor) |
| `styles.css` | Mor tema, mobil öncelikli düzen |
| `app.js` | Oyun akışı, gizli oylama sırası, azınlık puanlaması ve hedef puan takibi |
| `questions.js` | 71 soru kartı |
| `assets/penguen.svg` | Penguen amblemi |

## Soru eklemek

`questions.js` içindeki diziye yeni bir nesne eklemek yeterli:

```js
{ q: "Hangisi daha çok sinir bozar?", a: "Sesli mesaj atan", b: "Habersiz arayan" }
```

`q` soruyu, `a` birinci seçeneği, `b` ikinci seçeneği tutar. Deste her oyunda
karıştırılır; tüm kartlar tükenirse yeniden karıştırılıp baştan başlanır.

## Notlar

- Oyuncu adları ve hedef puan tercihi tarayıcının yerel deposunda saklanır, böylece
  sonraki oyunda hazır gelir. Depolama kapalıysa oyun yine sorunsuz çalışır.
- Gizli seçim sırası her turda yeniden karıştırılır; sıra hep aynı oyuncudan
  başlamaz.
