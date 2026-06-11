/* ============================================================
   AGRO FORTE — script.js
   Lógica completa do jogo: fases, pontuação, evento e resultado
   ============================================================ */

// ── DADOS DO JOGO ──────────────────────────────────────────

const PHASES = [
  {
    num: 1,
    theme: "Uso da Água",
    emoji: "💧",
    scenario: "Uma seca atingiu a região. Como você vai irrigar sua plantação?",
    options: [
      { letter: "A", text: "Instalar irrigação por gotejamento.", prod: +1, env: +2 },
      { letter: "B", text: "Usar água sem controle.",             prod: +1, env: -2 }
    ],
    curiosity: "A irrigação por gotejamento pode economizar até 70% de água comparado à irrigação convencional."
  },
  {
    num: 2,
    theme: "Conservação do Solo",
    emoji: "🌱",
    scenario: "O solo começa a perder nutrientes. O que você faz?",
    options: [
      { letter: "A", text: "Fazer rotação de culturas.",                   prod: +2, env: +2 },
      { letter: "B", text: "Plantar a mesma cultura todos os anos.",        prod: +1, env: -2 }
    ],
    curiosity: "A rotação de culturas melhora a fertilidade e a estrutura do solo, reduzindo a necessidade de fertilizantes."
  },
  {
    num: 3,
    theme: "Controle de Pragas",
    emoji: "🐞",
    scenario: "Insetos estão atacando sua plantação. Qual a melhor estratégia?",
    options: [
      { letter: "A", text: "Utilizar controle biológico.",        prod: +1, env: +2 },
      { letter: "B", text: "Aplicar agrotóxicos em excesso.",     prod: +2, env: -3 }
    ],
    curiosity: "O controle biológico usa inimigos naturais das pragas, como joaninhas e vespas parasitas, protegendo o meio ambiente."
  },
  {
    num: 4,
    theme: "Preservação da Vegetação",
    emoji: "🌳",
    scenario: "Você deseja expandir sua fazenda. O que você faz?",
    options: [
      { letter: "A", text: "Preservar matas e áreas próximas aos rios.", prod: +1, env: +3 },
      { letter: "B", text: "Remover toda a vegetação.",                   prod: +2, env: -4 }
    ],
    curiosity: "As matas ciliares protegem os rios, mantêm o clima estável e preservam a biodiversidade local."
  },
  {
    num: 5,
    theme: "Tecnologia Sustentável",
    emoji: "🤖",
    scenario: "Você recebeu recursos para investir. Qual sua escolha?",
    options: [
      { letter: "A", text: "Investir em tecnologias sustentáveis.", prod: +2, env: +2 },
      { letter: "B", text: "Ignorar novas tecnologias.",            prod:  0, env: -1 }
    ],
    curiosity: "Tecnologias modernas como drones e energia solar aumentam a produção com menor impacto ambiental."
  }
];

const SPECIAL_EVENTS = [
  { id: 1, name: "Chuva em época certa",          emoji: "🌧️", prod: 0,  env: +2 },
  { id: 2, name: "Programa de reflorestamento",   emoji: "🌳", prod: 0,  env: +2 },
  { id: 3, name: "Ataque inesperado de pragas",   emoji: "🦗", prod: -1, env:  0 },
  { id: 4, name: "Tecnologia premiada",           emoji: "🏆", prod: +1, env: +1 }
];

// ── ESTADO ─────────────────────────────────────────────────

let state = {
  prod: 5,
  env:  5,
  currentPhase: 0,
  history: [],
  locked: false
};

// ── UTILITÁRIOS ────────────────────────────────────────────

function fmt(n) {
  return (n > 0 ? "+" : "") + n;
}

function deltaTag(n, label) {
  const cls = n > 0 ? "pos" : n < 0 ? "neg" : "neutral";
  return `<span class="delta ${cls}">${label}: ${fmt(n)}</span>`;
}

function setProgress(step) {
  // step: 0–5 (phases) + optional bonus
  const pct = Math.min((step / 5) * 100, 100);
  document.getElementById("progress-bar").style.width = pct + "%";
}

function updateScoreboard(label) {
  document.getElementById("prod-score").textContent = state.prod;
  document.getElementById("env-score").textContent  = state.env;
  if (label) document.getElementById("phase-indicator").textContent = label;
}

// ── RENDERIZAÇÃO ───────────────────────────────────────────

function renderPhase(phaseIdx) {
  const p = PHASES[phaseIdx];
  const area = document.getElementById("game-area");

  let html = `
    <div class="phase-card" id="phase-card">
      <div class="phase-eyebrow">
        <span class="phase-num">Fase ${p.num}</span>
        <span class="phase-theme">${p.emoji} ${p.theme}</span>
      </div>
      <p class="phase-scenario">${p.scenario}</p>
      <div class="options-grid">`;

  p.options.forEach((opt, i) => {
    html += `
        <button class="option-btn" data-idx="${i}" onclick="choose(${phaseIdx}, ${i})">
          <span class="opt-badge">${opt.letter}</span>
          <div class="opt-body">
            <span class="opt-text">${opt.text}</span>
            <span class="opt-points">
              ${deltaTag(opt.prod, "Produção")} &nbsp; ${deltaTag(opt.env, "Meio Ambiente")}
            </span>
          </div>
        </button>`;
  });

  html += `
      </div>
      <div class="feedback-area" id="feedback-area"></div>
    </div>`;

  area.innerHTML = html;
  area.classList.remove("fade-in");
  void area.offsetWidth;
  area.classList.add("fade-in");
}

function renderFeedback(phaseIdx, optIdx) {
  const p   = PHASES[phaseIdx];
  const sel = p.options[optIdx];
  const fb  = document.getElementById("feedback-area");

  // Highlight chosen button
  document.querySelectorAll(".option-btn").forEach((btn, i) => {
    btn.disabled = true;
    btn.classList.toggle("chosen", i === optIdx);
  });

  fb.innerHTML = `
    <div class="feedback-box">
      <p class="feedback-result">
        Você escolheu <strong>${sel.letter}</strong> — 
        ${deltaTag(sel.prod, "Produção")} &nbsp; ${deltaTag(sel.env, "Meio Ambiente")}
      </p>
      <p class="curiosity">
        <span class="curiosity-label">💡 Curiosidade</span>
        ${p.curiosity}
      </p>
    </div>
    <div class="next-row">
      ${phaseIdx < PHASES.length - 1
        ? `<button class="next-btn" onclick="nextPhase()">Próxima fase →</button>`
        : `<button class="next-btn" onclick="showEvent()">Ver Evento Especial →</button>`
      }
    </div>`;

  fb.classList.add("slide-in");
}

// ── AÇÕES ─────────────────────────────────────────────────

function choose(phaseIdx, optIdx) {
  if (state.locked) return;
  state.locked = true;

  const opt = PHASES[phaseIdx].options[optIdx];
  state.prod += opt.prod;
  state.env  += opt.env;
  state.history.push({
    phase:  PHASES[phaseIdx].theme,
    choice: opt.letter,
    prod:   opt.prod,
    env:    opt.env
  });

  updateScoreboard();
  renderFeedback(phaseIdx, optIdx);
}

function nextPhase() {
  state.currentPhase++;
  state.locked = false;
  const p = state.currentPhase;
  updateScoreboard(`Fase ${p + 1} de 5`);
  setProgress(p);
  renderPhase(p);
}

function showEvent() {
  const evt = SPECIAL_EVENTS[Math.floor(Math.random() * SPECIAL_EVENTS.length)];
  state.prod += evt.prod;
  state.env  += evt.env;
  updateScoreboard("Evento Especial!");
  setProgress(5);

  const area = document.getElementById("game-area");
  area.innerHTML = `
    <div class="phase-card fade-in">
      <div class="phase-eyebrow">
        <span class="phase-num">Bônus</span>
        <span class="phase-theme">Evento Especial</span>
      </div>
      <div class="event-hero">${evt.emoji}</div>
      <p class="phase-scenario">${evt.name}</p>
      <div class="feedback-box" style="margin-top:1rem">
        ${deltaTag(evt.prod, "Produção")} &nbsp; ${deltaTag(evt.env, "Meio Ambiente")}
      </div>
      <div class="next-row">
        <button class="next-btn" onclick="showResult()">Ver resultado final →</button>
      </div>
    </div>`;
}

function showResult() {
  const total = state.prod + state.env;
  let level, desc, icon;

  if (total >= 18) {
    level = "Mestre do Agro Sustentável";
    desc  = "Você conseguiu produzir alimentos e preservar a natureza. Excelente!";
    icon  = "🏆";
  } else if (total >= 14) {
    level = "Produtor Consciente";
    desc  = "Boas decisões! Você está no caminho certo, mas ainda pode melhorar o equilíbrio.";
    icon  = "🌿";
  } else {
    level = "Gestão Desequilibrada";
    desc  = "É preciso rever suas escolhas e buscar mais equilíbrio entre produção e meio ambiente.";
    icon  = "⚠️";
  }

  document.getElementById("phase-indicator").textContent = "Resultado Final";

  const historyRows = state.history.map(h => `
    <tr>
      <td>${h.phase}</td>
      <td class="center">Opção ${h.choice}</td>
      <td class="center">${deltaTag(h.prod, "P")}</td>
      <td class="center">${deltaTag(h.env, "MA")}</td>
    </tr>`).join("");

  const area = document.getElementById("game-area");
  area.innerHTML = `
    <div class="result-card fade-in">
      <div class="result-icon">${icon}</div>
      <h2 class="result-title">${level}</h2>
      <p class="result-desc">${desc}</p>

      <div class="result-scores">
        <div class="result-score-item prod">
          <span class="rs-label">Produção</span>
          <span class="rs-val">${state.prod}</span>
        </div>
        <div class="result-score-item total">
          <span class="rs-label">Total</span>
          <span class="rs-val">${total}</span>
        </div>
        <div class="result-score-item env">
          <span class="rs-label">Meio Ambiente</span>
          <span class="rs-val">${state.env}</span>
        </div>
      </div>

      <div class="history-table-wrap">
        <h3 class="history-title">Histórico de escolhas</h3>
        <table class="history-table">
          <thead>
            <tr>
              <th>Fase</th>
              <th>Escolha</th>
              <th>Produção</th>
              <th>Meio Ambiente</th>
            </tr>
          </thead>
          <tbody>${historyRows}</tbody>
        </table>
      </div>

      <div class="legend">
        <span class="legend-item pos">● Ganhou pontos</span>
        <span class="legend-item neg">● Perdeu pontos</span>
        <span class="legend-item neutral">● Sem alteração</span>
      </div>

      <button class="next-btn restart-btn" onclick="restartGame()">Jogar novamente →</button>
    </div>`;
}

// ── REINICIAR ─────────────────────────────────────────────

function restartGame() {
  state = { prod: 5, env: 5, currentPhase: 0, history: [], locked: false };
  updateScoreboard("Fase 1 de 5");
  setProgress(0);
  renderPhase(0);
}

// ── INICIALIZAÇÃO ─────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  updateScoreboard("Fase 1 de 5");
  setProgress(0);
  renderPhase(0);
});
