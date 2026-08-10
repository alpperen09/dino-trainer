# Chrome Dino AI

Chrome Dino oyunu için yapay zekâ tabanlı oynama ve eğitim sistemi.

## Dosyalar

* `script.js` → Önceden eğitilmiş beyni içerir. Chrome Dino üzerinde doğrudan kullanılabilir.
* `train.js` → Dino'nun sıfırdan başlayarak nesiller boyunca öğrenmesini sağlar.

## Eğitim

`train.js` çalıştırıldığında Dino, nesiller boyunca oynayarak ve öğrenerek kendi beynini geliştirir.

Eğitim sırasında elde edilen güncel beyni kaydetmek için:

```js
dinoAI.download()
```

komutu kullanılabilir.

Bu komut, mevcut beyni **JSON** formatında dışa aktarır.

## Eğitilmiş Beyni Kullanma

`dinoAI.download()` ile kaydedilen JSON verisini `script.js` dosyasındaki 2. satırda bulunan:

```js
window.DINO_SEED
```

değişkenine yerleştirerek, yeni eğitilmiş beyin ile Chrome Dino'yu çalıştırabilirsiniz.

Böylece `script.js`, eğitim sırasında elde edilen güncel beyni kullanarak oyunu oynar.
