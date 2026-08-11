(function () {
  const runner = Runner.getInstance();
  if (!runner) { console.error('❌ Runner bulunamadı.'); return; }

  // ---- Sinir ağı: 5 girdi -> 10 gizli -> 1 çıktı (sadece zıpla) ----
  class NN {
    constructor(w1, w2) {
      this.w1 = w1 || NN.randMat(5, 10);
      this.w2 = w2 || NN.randMat(10, 1);
    }
    static randMat(r, c) {
      const m = [];
      for (let i = 0; i < r; i++) { const row = []; for (let j = 0; j < c; j++) row.push(Math.random() * 2 - 1); m.push(row); }
      return m;
    }
    static tanh(x) { return Math.tanh(x); }
    static sigmoid(x) { return 1 / (1 + Math.exp(-x)); }
    predict(inputs) {
      const hidden = new Array(this.w1[0].length).fill(0);
      for (let j = 0; j < hidden.length; j++) {
        let s = 0;
        for (let i = 0; i < inputs.length; i++) s += inputs[i] * this.w1[i][j];
        hidden[j] = NN.tanh(s);
      }
      let s = 0;
      for (let j = 0; j < hidden.length; j++) s += hidden[j] * this.w2[j][0];
      return NN.sigmoid(s); // jumpProb
    }
    copy() { return new NN(this.w1.map(r => r.slice()), this.w2.map(r => r.slice())); }
    toJSON() { return { w1: this.w1, w2: this.w2 }; }
    static crossover(a, b) {
      const c = new NN();
      for (let i = 0; i < c.w1.length; i++) for (let j = 0; j < c.w1[i].length; j++) c.w1[i][j] = Math.random() < 0.5 ? a.w1[i][j] : b.w1[i][j];
      for (let i = 0; i < c.w2.length; i++) for (let j = 0; j < c.w2[i].length; j++) c.w2[i][j] = Math.random() < 0.5 ? a.w2[i][j] : b.w2[i][j];
      return c;
    }
    mutate(rate, magnitude) {
      const mv = v => (Math.random() < rate ? v + (Math.random() * 2 - 1) * magnitude : v);
      for (let i = 0; i < this.w1.length; i++) for (let j = 0; j < this.w1[i].length; j++) this.w1[i][j] = mv(this.w1[i][j]);
      for (let i = 0; i < this.w2.length; i++) for (let j = 0; j < this.w2[i].length; j++) this.w2[i][j] = mv(this.w2[i][j]);
    }
  }

  // ---- Ayarlar ----
  const POP = 24;
  const TRIALS_PER_GENOME = 2;
  const ELITE_COUNT = 3;
  let mutationRate = 0.15;
  let mutationMagnitude = 0.5;

  let population = Array.from({ length: POP }, () => new NN());
  let scoresSum = new Array(POP).fill(0);
  let trialCount = new Array(POP).fill(0);
  let genIndex = 0;
  let generation = 1;

  let hallOfFame = null;
  let bestScoreEver = 0;

  function downloadJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function currentSaveObject() {
    return {
      brain: (hallOfFame || population[0]).toJSON(),
      generation: generation,
      bestScoreEver: Math.floor(bestScoreEver)
    };
  }

  window.dinoAI = {
    exportBrain: () => currentSaveObject(),
    download: () => downloadJSON(currentSaveObject(), `dino-brain-gen${generation}.json`)
  };

  // ---- HUD ----
  const hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;top:10px;left:10px;z-index:99999;background:#fff;padding:8px 12px;border:2px solid #333;border-radius:6px;font-family:monospace;font-size:14px;line-height:1.4;';
  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Kaydet';
  saveBtn.style.cssText = 'margin-top:6px;padding:4px 10px;cursor:pointer;';
  saveBtn.onclick = () => window.dinoAI.download();
  hud.appendChild(saveBtn);
  document.body.appendChild(hud);

  function updateHud() {
    saveBtn.remove();
    hud.innerHTML = `Nesil: ${generation}<br>Birey: ${genIndex + 1}/${POP} (deneme ${trialCount[genIndex] + 1}/${TRIALS_PER_GENOME})<br>Mutasyon: ${mutationRate.toFixed(3)}<br>En iyi skor (ham): ${Math.floor(bestScoreEver)}`;
    hud.appendChild(saveBtn);
  }
  updateHud();

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
    const jumpProb = population[genIndex].predict([distance, width, obsY, speed, airborne]);

    if (jumpProb > 0.5 && !trex.jumping) trex.startJump(runner.currentSpeed);
  }

  function evolve() {
    const avgScores = scoresSum.map((s, i) => s / Math.max(1, trialCount[i]));
    const idx = population.map((_, i) => i).sort((a, b) => avgScores[b] - avgScores[a]);
    const sorted = idx.map(i => population[i]);
    const bestOfGen = avgScores[idx[0]];

    let improved = false;
    if (bestOfGen > bestScoreEver) {
      bestScoreEver = bestOfGen;
      hallOfFame = sorted[0].copy();
      improved = true;
    }

    const newPop = [];
    if (hallOfFame) newPop.push(hallOfFame.copy());
    for (let i = 0; i < ELITE_COUNT && newPop.length < POP; i++) newPop.push(sorted[i].copy());

    const poolSize = Math.max(6, Math.floor(POP * 0.4));
    const pool = sorted.slice(0, poolSize);
    while (newPop.length < POP) {
      const a = pool[Math.floor(Math.random() * pool.length)];
      const b = pool[Math.floor(Math.random() * pool.length)];
      const child = NN.crossover(a, b);
      child.mutate(mutationRate, mutationMagnitude);
      newPop.push(child);
    }

    population = newPop;
    scoresSum = new Array(POP).fill(0);
    trialCount = new Array(POP).fill(0);
    genIndex = 0;
    generation++;

    mutationRate = Math.max(0.03, mutationRate * 0.97);
    mutationMagnitude = Math.max(0.15, mutationMagnitude * 0.97);

    if (improved) {
      downloadJSON(currentSaveObject(), `dino-brain-gen${generation}-auto.json`);
      console.log(`%c🏆 Yeni rekor! Nesil ${generation}, skor ${Math.floor(bestScoreEver)} → otomatik indirildi.`, 'color:orange;font-weight:bold;');
    }
  }

  function gameLoop() {
    if (runner.crashed) {
      scoresSum[genIndex] += runner.distanceRan || 0;
      trialCount[genIndex]++;

      if (trialCount[genIndex] >= TRIALS_PER_GENOME) {
        genIndex++;
        if (genIndex >= POP) evolve();
      }
      updateHud();
      setTimeout(() => runner.restart(), 60);
    } else if (runner.playing || runner.activated) {
      think();
    }
    requestAnimationFrame(gameLoop);
  }

  if (runner.crashed || !runner.playing) runner.restart();
  requestAnimationFrame(gameLoop);
  console.log('%c▶️ Sıfırdan eğitim başladı (eğilme devre dışı).', 'color:green;font-weight:bold;');
})();