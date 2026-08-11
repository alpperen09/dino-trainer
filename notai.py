(function () {
  const runner = Runner.getInstance();
  if (!runner) { console.error('❌ Runner bulunamadı.'); return; }

  // 1. Önümüzdeki ilk engeli bulan yardımcı fonksiyon
  function getNextObstacle() {
    const obstacles = runner.horizon && runner.horizon.obstacles;
    if (!obstacles || obstacles.length === 0) return null;
    const trexX = runner.tRex.xPos;
    
    // Geçilmemiş ilk engeli seç
    for (const o of obstacles) {
      if (o.xPos + o.width > trexX) return o;
    }
    return null;
  }

  // 2. Ana Karar Mekanizması (if-else Mantığı)
  function think() {
    if (runner.crashed) return;

    const trex = runner.tRex;
    const obstacle = getNextObstacle();

    if (obstacle) {
      const distance = obstacle.xPos - trex.xPos; // Engelle aradaki net piksel
      const speed = runner.currentSpeed;         // Oyunun o anki hızı
      
      // Hız arttıkça zıplama mesafesi eşiğini dinamik olarak artırıyoruz.
      // Eşik hesabı: (Hız * katsayı) + güvenlik payı
      const jumpThreshold = (speed * 18) + (obstacle.width / 2);

      // ENGEL YÜKSEKLİK KONTROLÜ (yPos)
      // Kaktüsler genelde yPos >= 20 seviyesindedir.
      // Kuşlar: Yüksek (75), Orta (50), Alçak (20-25) uçabilir.
      const isHighBird = obstacle.yPos < 40 && obstacle.yPos > 0; 
      const isMidBird = obstacle.yPos >= 40 && obstacle.yPos < 75;

      // --- KARAR ANI ---
      
      // DURUM A: Yüksekten uçan kuş (Hiçbir şey yapma, altından geç)
      if (isHighBird && distance < jumpThreshold) {
        trex.setDuck(false);
      }
      // DURUM B: Ortadan uçan kuş (Zıplama, EĞİL)
      else if (isMidBird && distance < jumpThreshold) {
        if (!trex.jumping) trex.setDuck(true);
      }
      // DURUM C: Kaktüs veya alçaktan uçan kuş (ZIPLA)
      else if (distance < jumpThreshold) {
        if (!trex.jumping) {
          trex.setDuck(false);
          trex.startJump(speed);
        }
      }
      // DURUM D: Güvende (Eğilmeyi bırak, koşmaya devam et)
      else {
        if (!trex.jumping) trex.setDuck(false);
      }
    } else {
      // Ekranda engel yoksa eğilmeyi iptal et
      if (!trex.jumping) trex.setDuck(false);
    }
  }

  // 3. Oyun Döngüsü
  function gameLoop() {
    if (runner.crashed) {
      setTimeout(() => runner.restart(), 400); // Ölünce otomatik yeniden başlat
    } else if (runner.playing || runner.activated) {
      think();
    }
    requestAnimationFrame(gameLoop);
  }

  if (runner.crashed || !runner.playing) runner.restart();
  requestAnimationFrame(gameLoop);
  console.log('%c▶️ Düz if-else botu çalıştırıldı.', 'color:green;font-weight:bold;');
})();