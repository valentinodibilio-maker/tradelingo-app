// Stato Globale dell'App
const state = {
  xp: 120,
  hearts: 5,
  streak: 3,
  balance: 10000.00,
  position: null, // { type: 'BUY'|'SELL', price: number, amount: number }
  stats: { trades: 0, wins: 0, pnl: 0.00 },
  currentPrice: 64500.00,
  candles: []
};

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  initChartData();
  renderChart();
  setInterval(tickMarket, 1000); // Simulatore in tempo reale
});

// Navigazione Tab
function switchTab(tabId) {
  document.querySelectorAll('.app-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  
  document.getElementById(`view-${tabId}`).classList.add('active');
  event.currentTarget.classList.add('active');

  if (tabId === 'sandbox') {
    setTimeout(renderChart, 50); // Re-render canvas per adattare la dimensione
  }
}

// --- ACADEMY LOGIC ---
const lessons = {
  1: {
    title: "Le Basi del Grafico",
    content: "Una <b>Candela Verde</b> indica che il prezzo è salito. una <b>Candela Rossa</b> indica che il prezzo è sceso.",
    question: "Cosa significa se vedi una candela verde con corpo molto lungo?",
    options: ["Forte pressione d'acquisto", "I venditori stanno dominando", "Il mercato è chiuso"],
    correct: 0
  },
  2: {
    title: "Supporti e Resistenze",
    content: "Un <b>Supporto</b> è un livello di prezzo dove i compratori entrano fermando la caduta.",
    question: "Il prezzo rimbalza più volte su una linea in basso. Cos'è?",
    options: ["Resistenza", "Supporto", "Breakout"],
    correct: 1
  }
};

function openLesson(id) {
  const lesson = lessons[id];
  if (!lesson) return;

  const modalBody = document.getElementById('lesson-body');
  modalBody.innerHTML = `
    <h3>${lesson.title}</h3>
    <p style="margin: 12px 0; color: #c9d1d9;">${lesson.content}</p>
    <hr style="border-color: #30363d; margin: 12px 0;">
    <p><b>Quiz:</b> ${lesson.question}</p>
    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
      ${lesson.options.map((opt, idx) => `
        <button class="event-btn" style="padding: 10px; text-align: left;" onclick="checkAnswer(${id}, ${idx})">${opt}</button>
      `).join('')}
    </div>
  `;
  document.getElementById('lesson-modal').classList.remove('hidden');
}

function closeLesson() {
  document.getElementById('lesson-modal').classList.add('hidden');
}

function checkAnswer(lessonId, optionIdx) {
  const lesson = lessons[lessonId];
  if (optionIdx === lesson.correct) {
    state.xp += 50;
    document.getElementById('xp-count').innerText = state.xp;
    alert("Corretto! +50 XP");
    closeLesson();
  } else {
    state.hearts = Math.max(0, state.hearts - 1);
    document.getElementById('hearts-count').innerText = state.hearts;
    alert("Sbagliato! Hai perso 1 Cuore.");
    if (state.hearts === 0) alert("Hai finito le vite! Riprova più tardi.");
  }
}

// --- SIMULATORE GRAFICO (SANDBOX) ---
function initChartData() {
  let basePrice = 64000;
  for (let i = 0; i < 30; i++) {
    let change = (Math.random() - 0.48) * 150;
    let open = basePrice;
    let close = open + change;
    let high = Math.max(open, close) + Math.random() * 50;
    let low = Math.min(open, close) - Math.random() * 50;
    state.candles.push({ open, high, low, close });
    basePrice = close;
  }
  state.currentPrice = basePrice;
}

function tickMarket() {
  let lastCandle = state.candles[state.candles.length - 1];
  let change = (Math.random() - 0.49) * 40;
  
  lastCandle.close += change;
  if (lastCandle.close > lastCandle.high) lastCandle.high = lastCandle.close;
  if (lastCandle.close < lastCandle.low) lastCandle.low = lastCandle.close;

  state.currentPrice = lastCandle.close;
  document.getElementById('live-price').innerText = `$${state.currentPrice.toFixed(2)}`;

  updatePositionPNL();
  renderChart();
}

function triggerMarketEvent(type) {
  let delta = 0;
  let tickerMsg = "";

  if (type === 'PUMP') {
    delta = 800;
    tickerMsg = "🚨 BREAKING: Elon Musk twitta su Bitcoin! Prezzo in impennata!";
  } else if (type === 'DUMP') {
    delta = -800;
    tickerMsg = "🚨 BREAKING: Una Balena muove 10.000 BTC su un Exchange! Forte vendita!";
  } else if (type === 'VOLATILE') {
    delta = (Math.random() - 0.5) * 1200;
    tickerMsg = "🚨 BREAKING: La FED annuncia tassi d'interesse a sorpresa!";
  }

  let lastCandle = state.candles[state.candles.length - 1];
  lastCandle.close += delta;
  if (lastCandle.close > lastCandle.high) lastCandle.high = lastCandle.close;
  if (lastCandle.close < lastCandle.low) lastCandle.low = lastCandle.close;

  document.getElementById('ticker-text').innerText = tickerMsg;
}

function renderChart() {
  const canvas = document.getElementById('tradingChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const padding = 20;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;

  let minPrice = Math.min(...state.candles.map(c => c.low));
  let maxPrice = Math.max(...state.candles.map(c => c.high));
  let candleWidth = width / state.candles.length;

  state.candles.forEach((c, i) => {
    let x = padding + i * candleWidth + candleWidth / 2;
    let openY = height + padding - ((c.open - minPrice) / (maxPrice - minPrice)) * height;
    let closeY = height + padding - ((c.close - minPrice) / (maxPrice - minPrice)) * height;
    let highY = height + padding - ((c.high - minPrice) / (maxPrice - minPrice)) * height;
    let lowY = height + padding - ((c.low - minPrice) / (maxPrice - minPrice)) * height;

    let isGreen = c.close >= c.open;
    ctx.strokeStyle = isGreen ? '#00ff88' : '#ff0055';
    ctx.fillStyle = isGreen ? '#00ff88' : '#ff0055';

    // Ombra/Stoppino
    ctx.beginPath();
    ctx.moveTo(x, highY);
    ctx.lineTo(x, lowY);
    ctx.stroke();

    // Corpo Candela
    let bodyHeight = Math.max(2, Math.abs(closeY - openY));
    ctx.fillRect(x - candleWidth / 3, Math.min(openY, closeY), (candleWidth / 3) * 2, bodyHeight);
  });
}

// --- TRADING SYSTEM ---
function executeTrade(type) {
  if (state.position) return alert("Hai già una posizione aperta!");

  state.position = {
    type: type,
    entryPrice: state.currentPrice,
    amount: 1000 // Posizione fissa a $1000
  };

  document.getElementById('close-pos-btn').classList.remove('hidden');
  updatePositionPNL();
}

function updatePositionPNL() {
  if (!state.position) return;

  let diff = state.currentPrice - state.position.entryPrice;
  if (state.position.type === 'SELL') diff = -diff;

  let pnl = (diff / state.position.entryPrice) * state.position.amount;
  let pnlText = pnl >= 0 ? `+$${pnl.toFixed(2)}` : `-$${Math.abs(pnl).toFixed(2)}`;
  
  document.getElementById('position-info').innerHTML = `
    Posizione: <b>${state.position.type}</b> @ $${state.position.entryPrice.toFixed(2)} | PnL: <span style="color: ${pnl >= 0 ? '#00ff88' : '#ff0055'}">${pnlText}</span>
  `;
}

function closePosition() {
  if (!state.position) return;

  let diff = state.currentPrice - state.position.entryPrice;
  if (state.position.type === 'SELL') diff = -diff;

  let pnl = (diff / state.position.entryPrice) * state.position.amount;
  state.balance += pnl;
  state.stats.trades++;
  if (pnl > 0) state.stats.wins++;
  state.stats.pnl += pnl;

  // Aggiorna UI
  document.getElementById('user-balance').innerText = `$${state.balance.toFixed(2)}`;
  document.getElementById('position-info').innerText = "Nessuna posizione aperta";
  document.getElementById('close-pos-btn').classList.add('hidden');

  // Aggiorna Profilo
  document.getElementById('stat-trades').innerText = state.stats.trades;
  document.getElementById('stat-winrate').innerText = `${Math.round((state.stats.wins / state.stats.trades) * 100)}%`;
  document.getElementById('stat-pnl').innerText = `$${state.stats.pnl.toFixed(2)}`;

  state.position = null;
}
