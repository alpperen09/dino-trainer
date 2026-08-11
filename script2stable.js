(function () {
  window.DINO_SEED = {"brain":{"w1":[[-0.8209224322107034,0.48935905791667367,0.27080400737511456,0.29880807090161726,0.8669699564963735,1.1347852267862015,-0.7054954345104747,0.3842601928696865,-0.10370049494875633,0.034710653192807917],[0.24707643723174638,-0.5094917515226043,0.38873233979943833,0.3735130924518977,0.18052375003473076,-0.42972470294937354,-0.7325196107101075,0.8951466410477253,-0.11206984920269426,0.6939548770218735],[0.3347537150834685,0.5905145797169,-0.5478931782003844,-0.6197493303975103,-0.3290157552619215,-0.6397143717927258,-1.4203686204337262,-0.39186319957361804,-0.4691270337404732,-0.5226123875482975],[1.3539989228588885,-1.0863301359524746,0.5711792085571354,0.9167010946077963,-0.5711430978610017,-0.055265656922019624,0.1807363155957225,0.5505440729845499,0.12915271763773845,0.37870038467756717],[-0.35723724373618376,-0.478323816755028,-0.47412026300278687,0.6644967344333254,-0.8747888567566149,0.04188484331228481,0.5473985324883837,-1.013437390275264,0.9792575387923207,-0.47626899129417344]],"w2":[[-0.5770266767319114,-0.18048942781666996],[-1.0247635614857047,-0.7025110873081575],[-0.137850634910797,-0.06558329732647983],[-0.6460140469729394,-0.038165379067051974],[-1.0971631764845104,1.104552716428115],[-0.5247919832848448,0.40932108468314954],[0.08346971285117577,-0.7549601584132591],[-0.11689312348925474,0.5942755198073373],[0.40901399523542614,0.5818009698429376],[0.08395849198250037,-0.39806095208239894]]},"generation":26,"bestScoreEver":24367};

  const runner = Runner.getInstance();
  if (!runner) { console.error('❌ Runner bulunamadı.'); return; }
  if (!window.DINO_SEED) { console.error('❌ DINO_SEED tanımlı değil.'); return; }

  const seed = window.DINO_SEED;
  const w1 = seed.brain.w1, w2 = seed.brain.w2;
  console.log(`%c📋 Yüklenen dosya: nesil ${seed.generation}, kayıtlı skor ${seed.bestScoreEver}`, 'color:blue;font-weight:bold;');
  console.log(`   w1 boyutu: ${w1.length} x ${w1[0].length}  (beklenen: 5 x 10)`);
  console.log(`   w2 boyutu: ${w2.length} x ${w2[0].length}  (beklenen: 10 x 2)`);

  if (w1.length !== 5 || w1[0].length !== 10 || w2.length !== 10 || w2[0].length !== 2) {
    console.error('❌ UYUMSUZ MİMARİ! Bu dosya v3 script formatında değil (eski/farklı bir sürümden kalma olabilir). Doğru dosyayı yüklediğinizden emin olun.');
    return;
  }
  console.log('%c✅ Mimari doğru, devam ediliyor...', 'color:green;');

  class NN {
    constructor(w1, w2) { this.w1 = w1; this.w2 = w2; }
    static tanh(x) { return Math.tanh(x); }
    static sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
    predict(inputs) {
      const hidden = new Array(this.w1[0].length).fill(0);
      for (let j = 0; j < hidden.length; j++) {
        let s = 0;
        for (let i = 0; i < inputs.length; i++) s += inputs[i] * this.w1[i][j];
        hidden[j] = NN.tanh(s);
      }
      const out = [0, 0];
      for (let k = 0; k < 2; k++) {
        let s = 0;
        for (let j = 0; j < hidden.length; j++) s += hidden[j] * this.w2[j][k];
        out[k] = NN.sigmoid(s);
      }
      return out;
    }
  }

  const brain = new NN(w1, w2);
  let bestScoreEver = seed.bestScoreEver || 0;
  let runCount = 0;

  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99999;background:#fff;padding:8px 12px;border:2px solid #333;border-radius:6px;font-family:monospace;font-size:14px;line-height:1.4;';
  document.body.appendChild(hud);
  function updateHud(currentScore) {
    hud.innerHTML = `Mod: SABİT BEYİN (nesil ${seed.generation})<br>Oynanış: ${runCount}<br>Anlık (ham): ${Math.floor(currentScore || 0)}<br>Kayıtlı en iyi (ham): ${Math.floor(bestScoreEver)}`;
  }
  updateHud(0);

  function nextObstacle() {
    const obstacles = runner.horizon && runner.horizon.obstacles;
    if (!obstacles || obstacles.length === 0) return null;
    const trexX = runner.tRex.xPos;
    for (const o of obstacles) if (o.xPos + o.width > trexX) return o;
    return null;
  }

  function think() {
    if (runner.crashed) return;
    const trex = runner.tRex;
    const obstacle = nextObstacle();
    let distance = 1, width = 0, obsY = 0;
    const speed = runner.currentSpeed / 13;
    if (obstacle) {
      distance = Math.max(0, obstacle.xPos - trex.xPos) / 600;
      width = obstacle.width / 100;
      obsY = obstacle.yPos / 100;
    }
    const airborne = trex.jumping ? 1 : 0;
    const [jumpProb, duckProb] = brain.predict([distance, width, obsY, speed, airborne]);

    if (jumpProb > 0.5 && !trex.jumping) trex.startJump(runner.currentSpeed);
    // egilme kapatildi (zaten kuslarda zipliyodu)
  }

  function gameLoop() {
    if (runner.crashed) {
      const finalScore = runner.distanceRan || 0;
      if (finalScore > bestScoreEver) bestScoreEver = finalScore;
      runCount++;
      updateHud(0);
      setTimeout(() => runner.restart(), 400);
    } else if (runner.playing || runner.activated) {
      think();
      updateHud(runner.distanceRan);
    }
    requestAnimationFrame(gameLoop);
  }

  if (runner.crashed || !runner.playing) runner.restart();
  requestAnimationFrame(gameLoop);
  console.log('%c▶️ Sabit beyinle oynatılıyor.', 'color:purple;font-weight:bold;');
})();