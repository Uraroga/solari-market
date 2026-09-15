import { CONFIG, CATEGORIES } from "./data.js";
import { opportunities } from "./presentation.js";
import {
  buyProperty,
  createInitialState,
  advanceMonth,
  saveStateToStorage,
} from "./game.js";
import {
  purchasePrice,
  formatSolari,
  investmentLabel,
  investmentProfile,
  netMonthly,
  ownerLabel,
  totalsForOwner,
} from "./market.js";

let state;
let currentView = "home";
let selectedId = null;
let finalDismissed = false;

export function initUi(initialState) {
  state = normalizeUiState(initialState);
  bindStaticEvents();
  document.querySelector(".brand").addEventListener("click", (e) => {
    e.preventDefault();
    showView("home");
  });
  saveAndRender();
}

function normalizeUiState(nextState) {
  if (typeof nextState.onboardingDismissed !== "boolean")
    nextState.onboardingDismissed = false;

  return nextState;
}

function bindStaticEvents() {
  document.querySelectorAll("dialog").forEach((dialog) =>
    dialog.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const controls = [
        ...dialog.querySelectorAll(
          'button:not(:disabled),a[href],input,select,[tabindex="0"]',
        ),
      ].filter((el) => el.getClientRects().length);
      const first = controls[0],
        last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }),
  );
  document
    .getElementById("nav-home")
    .addEventListener("click", () => showView("home"));
  document
    .getElementById("nav-owned")
    .addEventListener("click", () => showView("owned"));
  document
    .getElementById("nav-portfolio")
    .addEventListener("click", () => showView("portfolio"));
  document.getElementById("next-month").addEventListener("click", () => {
    advanceMonth(state);

    saveAndRender();
  });
  document.getElementById("new-game").addEventListener("click", requestNewGame);
  document
    .getElementById("reset-cancel")
    .addEventListener("click", () =>
      document.getElementById("reset-dialog").close(),
    );
  document.getElementById("reset-confirm").addEventListener("click", () => {
    const dismissed = state.onboardingDismissed;
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    state = normalizeUiState(createInitialState());
    state.onboardingDismissed = dismissed;
    currentView = "home";
    selectedId = null;
    finalDismissed = false;
    resetFilters();
    saveAndRender();
    document.getElementById("home-title").focus();
  });
  document
    .getElementById("onboarding-start")
    .addEventListener("click", dismissOnboarding);
  document
    .getElementById("onboarding-modal")
    .addEventListener("cancel", (e) => {
      e.preventDefault();
      dismissOnboarding();
    });
  ["search", "filter-category", "filter-risk", "sort-price"].forEach((id) =>
    document.getElementById(id).addEventListener("input", renderCatalog),
  );
}

function requestNewGame() {
  document.getElementById("reset-dialog").showModal();
  document.getElementById("reset-cancel").focus();
}
function dismissOnboarding() {
  state.onboardingDismissed = true;
  document.getElementById("onboarding-modal").close();
  saveAndRender();
  document.getElementById("home-title").focus();
}
function showView(view, id = null) {
  currentView = view;
  selectedId = id;
  render();
  window.scrollTo({ top: 0, behavior: "instant" });
  document.getElementById(`${view}-title`)?.focus({ preventScroll: true });
}
function saveAndRender() {
  const notice = document.getElementById("save-status");
  try {
    saveStateToStorage(state);
    notice.textContent = "Partita salvata su questo dispositivo";
    notice.classList.remove("save-warning");
  } catch {
    notice.textContent =
      "Salvataggio non disponibile: i progressi restano solo in questa scheda.";
    notice.classList.add("save-warning");
  }
  render();
}

function render() {
  const player = totalsForOwner(state, "player");
  document.getElementById("month-label").textContent =
    `Mese ${state.month} / ${CONFIG.totalMonths}`;
  document.getElementById("cash-label").textContent = formatSolari(
    state.playerCash,
  );
  document.getElementById("networth-label").textContent = formatSolari(
    player.netWorth,
  );
  document.querySelectorAll(".nav-link").forEach((b) => {
    const active =
      b.dataset.view === (currentView === "detail" ? "home" : currentView);
    b.classList.toggle("active", active);
    if (active) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  document.getElementById("netmonthly-label").textContent = formatSolari(
    player.netIncome,
  );
  document.getElementById("home-view").hidden = currentView !== "home";
  document.getElementById("detail-view").hidden = currentView !== "detail";
  document.getElementById("owned-view").hidden = currentView !== "owned";
  document.getElementById("portfolio-view").hidden =
    currentView !== "portfolio";
  const intro = document.getElementById("onboarding-modal");
  if (!state.onboardingDismissed && !state.gameOver && !intro.open) {
    intro.showModal();
    document.getElementById("onboarding-start").focus();
  }
  document.getElementById("next-month").disabled = state.gameOver;
  renderHome();
  renderNextStep(player);
  renderCatalog();
  renderDetail();
  renderOwned();
  renderPortfolio();
  renderCpuPanel();
  renderLog();
  renderFinal();
}

function renderHome() {
  document.getElementById("opportunities").innerHTML =
    opportunities(state)
      .map((p, i) => cardHtml(p, i + 1))
      .join("") ||
    '<p class="empty">Nessuna opportunità alla portata della tua liquidità. Conserva la riserva e valuta il prossimo mese.</p>';
  bindDetailButtons(document.getElementById("opportunities"));
  document.getElementById("category-entries").innerHTML = CATEGORIES.map(
    (c, i) =>
      `<button data-category="${c}" aria-pressed="${document.getElementById("filter-category").value === c}"><img src="assets/categories/${i}.svg" alt=""><span>${c}<span aria-hidden="true">↗</span></span></button>`,
  ).join("");
  document.querySelectorAll("[data-category]").forEach((b) =>
    b.addEventListener("click", () => {
      resetFilters();
      document.getElementById("filter-category").value = b.dataset.category;
      renderCatalog();
      document.getElementById("catalog-title").focus();
    }),
  );
}
function resetFilters() {
  ["search", "filter-category", "filter-risk"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("sort-price").value = "asc";
}
function bindDetailButtons(root) {
  root
    .querySelectorAll("[data-detail]")
    .forEach((b) =>
      b.addEventListener("click", () => showView("detail", b.dataset.detail)),
    );
}
function cardHtml(p, rank = 0) {
  return `<article class="card ${p.owner ? "sold" : ""}"><button class="card-link" data-detail="${p.id}" aria-label="Vedi dettagli: ${p.nome}">${imageHtml(p)}${rank ? `<span class="rank">0${rank} / NETTO-PREZZO</span>` : ""}<div class="card-body"><span class="category-name">${p.categoria}</span><h3>${p.nome}</h3><div class="card-metrics"><strong>${formatSolari(purchasePrice(p))}</strong><span class="net">+${formatSolari(netMonthly(p))}<small>/ mese netto</small></span></div><div class="card-bottom">${badge(p.rischio)}${stateBadge(p.owner)}<span aria-hidden="true">↗</span></div></div></button></article>`;
}

function renderNextStep(player) {
  if (state.gameOver) {
    document.getElementById("next-step").textContent =
      "Sfida conclusa. Consulta il portafoglio o inizia una nuova partita.";
    return;
  }
  let message = player.count
    ? "Esplora le opportunità di questo mese oppure conserva liquidità e avanza."
    : "Esplora il catalogo e valuta un primo acquisto.";
  if (state.playerCash < CONFIG.minimumCashReserve)
    message =
      "Attenzione: sei sotto la riserva minima. Ricostruisci liquidità prima di acquistare ancora.";
  else if (state.purchasesThisMonth.player > 0)
    message =
      "Quando sei pronto, passa al mese successivo e osserva mercato e Competitor.";
  if (state.purchasesThisMonth.player >= CONFIG.maxPurchasesPerMonth)
    message = "Limite mensile raggiunto: passa al mese successivo per acquistare ancora.";
  document.getElementById("next-step").textContent = `Acquisti: ${state.purchasesThisMonth.player} / ${CONFIG.maxPurchasesPerMonth}. ${message}`;
}

function badge(risk) {
  return `<span class="risk ${risk.toLowerCase()}">${risk}</span>`;
}
function stateBadge(owner) {
  const label =
    owner === "player" ? "Tuo" : owner === "cpu" ? "Competitor" : "Disponibile";
  return `<span class="state-badge ${owner || "free"}">${label}</span>`;
}
function imageHtml(property, size = "small") {
  return `<img class="property-image ${size}" src="assets/properties/${property.id}.svg" alt="Illustrazione di ${property.nome}" width="600" height="360">`;
}

function renderCatalog() {
  const wrap = document.getElementById("catalog");
  if (!wrap) return;
  const q = document.getElementById("search").value.trim().toLowerCase();
  const cat = document.getElementById("filter-category").value;
  const risk = document.getElementById("filter-risk").value;
  const sort = document.getElementById("sort-price").value;
  let props = state.properties
    .filter((p) => !q || p.nome.toLowerCase().includes(q))
    .filter((p) => !cat || p.categoria === cat)
    .filter((p) => !risk || p.rischio === risk);
  props.sort((a, b) =>
    sort === "desc" ? purchasePrice(b) - purchasePrice(a) : purchasePrice(a) - purchasePrice(b),
  );
  document.getElementById("result-count").textContent =
    `${props.length} immobili`;
  document
    .querySelectorAll("[data-category]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.category === cat)),
    );
  wrap.innerHTML =
    props.map((p) => cardHtml(p)).join("") ||
    '<div class="empty"><h3>Nessun immobile trovato</h3><p>Prova un altro nome oppure rimuovi i filtri.</p><button id="reset-filters">Azzera filtri</button></div>';
  bindDetailButtons(wrap);
  document.getElementById("reset-filters")?.addEventListener("click", () => {
    resetFilters();
    renderCatalog();
    document.getElementById("search").focus();
  });
}

function renderDetail() {
  const box = document.getElementById("detail-content");
  const p = state.properties.find((x) => x.id === selectedId);
  if (!p) {
    box.innerHTML = "";
    return;
  }
  const atCap = state.purchasesThisMonth.player >= CONFIG.maxPurchasesPerMonth;
  const wouldBreakReserve = state.playerCash - purchasePrice(p) < CONFIG.minimumCashReserve;
  const canBuy = !p.owner && !state.gameOver && !atCap && !wouldBreakReserve;
  const unavailableHint = state.gameOver
    ? "La partita è conclusa."
    : atCap
      ? "Limite mensile di 3 acquisti raggiunto. Passa al mese successivo."
      : wouldBreakReserve
        ? `Devi mantenere almeno ${formatSolari(CONFIG.minimumCashReserve)} di riserva.`
        : "";
  box.innerHTML = `<button class="back text-button" id="back-to-catalog">← Torna al catalogo</button><section class="detail-card">
    <div class="detail-hero">${imageHtml(p, "large")}<div class="detail-offer"><span class="eyebrow">${p.categoria} / ${investmentLabel(p)}</span><h1 id="detail-title" tabindex="-1">${p.nome}</h1><div class="detail-badges">${badge(p.rischio)}${stateBadge(p.owner)}</div><div class="asking-price"><span>Prezzo di acquisto</span><strong>${formatSolari(purchasePrice(p))}</strong></div><div class="detail-net"><span>Guadagno netto mensile</span><strong>+${formatSolari(netMonthly(p))}</strong></div><button class="primary buy-cta" id="buy-button" ${canBuy ? "" : "disabled"}>${p.owner === "player" ? "Già nel tuo patrimonio" : p.owner === "cpu" ? "Acquistato dalil Competitor" : `Acquista · ${formatSolari(purchasePrice(p))}`}</button><p class="hint">${!p.owner ? (canBuy ? `Dopo l’acquisto: ${formatSolari(state.playerCash - purchasePrice(p))} di liquidità.` : unavailableHint) : "Questo immobile non è più disponibile sul mercato."}</p></div></div>
    <div class="detail-secondary"><div><h2>L’immobile</h2><p>${p.descrizione}</p><p class="hint">Tutti gli immobili crescono dello 0,25% al mese. Il rischio è un criterio del Competitor, non una probabilità di perdita; rendita e costo restano fissi.</p><h3>Profilo investimento</h3><p>${investmentProfile(p)}</p></div><dl class="fact-list"><div><dt>Rendita / mese</dt><dd>${formatSolari(p.rendita)}</dd></div><div><dt>Gestione / mese</dt><dd>−${formatSolari(p.costo)}</dd></div><div><dt>Valore di mercato</dt><dd>${formatSolari(p.valore)}</dd></div><div><dt>Proprietario</dt><dd>${ownerLabel(p.owner)}</dd></div></dl></div></section>`;
  document.getElementById("back-to-catalog").addEventListener("click", () => {
    const id = p.id;
    showView("home");
    document.querySelector(`#catalog [data-detail="${id}"]`)?.focus();
  });
  document.getElementById("buy-button").addEventListener("click", () => {
    if (buyProperty(state, p.id, "player")) {

      saveAndRender();
      const dialog = document.getElementById("purchase-dialog");
      dialog.innerHTML = `<div class="receipt-seal" aria-hidden="true">✓</div><span class="eyebrow">Un nuovo indirizzo nel tuo patrimonio</span><h2 id="purchase-title">Acquisto completato</h2><p class="receipt-name">${p.nome}</p><dl class="fact-list"><div><dt>Liquidità utilizzata</dt><dd>−${formatSolari(purchasePrice(p))}</dd></div><div><dt>Netto mensile aggiunto</dt><dd>+${formatSolari(netMonthly(p))}</dd></div><div><dt>Liquidità residua</dt><dd>${formatSolari(state.playerCash)}</dd></div></dl><button class="primary" id="purchase-owned">Vai ai miei immobili</button><button class="text-button" id="purchase-close">Continua a esplorare</button>`;
      dialog.showModal();
      document.getElementById("purchase-owned").focus();
      document.getElementById("purchase-owned").onclick = () => {
        dialog.close();
        showView("owned");
      };
      document.getElementById("purchase-close").onclick = () => {
        dialog.close();
        showView("home");
      };
      dialog.oncancel = () => {
        queueMicrotask(() => document.getElementById("detail-title")?.focus());
      };
    }
  });
}

function renderOwned() {
  const owned = state.properties.filter((p) => p.owner === "player");
  const t = totalsForOwner(state, "player");
  document.getElementById("owned-summary").innerHTML =
    `<dl class="estate-summary">${[
      ["Immobili", t.count],
      ["Valore immobili", formatSolari(t.value)],
      ["Rendite / mese", formatSolari(t.income)],
      ["Costi / mese", formatSolari(t.costs)],
      ["Netto / mese", formatSolari(t.netIncome)],
    ]
      .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
      .join("")}</dl>`;
  document.getElementById("owned-list").innerHTML =
    owned.map(propertyRow).join("") ||
    '<div class="empty estate-empty"><img src="assets/categories/1.svg" alt=""><h2>Il primo indirizzo ti aspetta</h2><p>Un immobile può trasformare la tua liquidità in rendita mensile.</p><button class="primary" id="find-first">Trova il primo immobile</button></div>';
  bindDetailButtons(document.getElementById("owned-list"));
  document
    .getElementById("find-first")
    ?.addEventListener("click", () => showView("home"));
}

function signed(value) {
  return `${value < 0 ? "−" : "+"}${formatSolari(Math.abs(value))}`;
}
function comparisonHtml(player, cpu) {
  return `<div class="compare">${[
    [player, "player", "TU"],
    [cpu, "cpu", "Competitor"],
  ]
    .map(
      ([t, key, label]) =>
        `<section class="compare-card compare-${key}"><div class="compare-label">${label}<span>${key === "player" ? "Il tuo patrimonio" : "Strategia bilanciata"}</span></div><span class="metric-label">Patrimonio netto</span><strong class="compare-worth" data-metric="netWorth">${formatSolari(t.netWorth)}</strong><dl class="compare-facts"><div><dt>Immobili</dt><dd data-metric="count">${t.count}</dd></div><div><dt>Netto / mese</dt><dd data-metric="netIncome">${formatSolari(t.netIncome)}</dd></div><div><dt>Liquidità</dt><dd>${formatSolari(t.cash)}</dd></div><div><dt>Valore immobili</dt><dd>${formatSolari(t.value)}</dd></div></dl></section>`,
    )
    .join("")}</div>`;
}
function renderPortfolio() {
  const player = totalsForOwner(state, "player");
  const cpu = totalsForOwner(state, "cpu");
  const lead = player.netWorth - cpu.netWorth;
  const growth = player.netWorth - CONFIG.initialCash;
  const cpuGrowth = cpu.netWorth - CONFIG.initialCash;
  const low = state.playerCash < CONFIG.minimumCashReserve;
  document.getElementById("portfolio-content").innerHTML =
    `<p id="portfolio-lead" class="portfolio-lead">${lead === 0 ? "Siete alla pari. Il prossimo investimento fa la differenza." : lead > 0 ? `Sei avanti di ${formatSolari(lead)} sulil Competitor.` : `Il Competitor è avanti di ${formatSolari(-lead)}. Ogni scelta conta.`}</p>${comparisonHtml(player, cpu)}<section id="growth-summary" class="growth-summary"><div><span class="eyebrow">Dal capitale iniziale a oggi</span><h2>La crescita, senza scorciatoie.</h2><p>${formatSolari(CONFIG.initialCash)} iniziali per ciascuno. Confronto tra capitale iniziale e patrimonio attuale.</p></div><dl><div><dt>TU</dt><dd>${signed(growth)}<small>${((growth / CONFIG.initialCash) * 100).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</small></dd></div><div><dt>Competitor</dt><dd>${signed(cpuGrowth)}<small>${((cpuGrowth / CONFIG.initialCash) * 100).toLocaleString("it-IT", { maximumFractionDigits: 1 })}%</small></dd></div></dl></section><section id="reserve-guidance" class="reserve-guidance ${low ? "low" : ""}"><h2>${low ? "Riserva ridotta" : "Liquidità disponibile"} · ${formatSolari(state.playerCash)}</h2><p>${low ? "Prima di investire ancora, ricostruisci la riserva minima." : `Ogni acquisto deve lasciare almeno ${formatSolari(CONFIG.minimumCashReserve)} di riserva.`} Costi ordinari attuali: <strong>${formatSolari(player.costs)}/mese</strong>. ${player.costs > 0 ? `La liquidità copre circa ${Math.max(0, Math.floor(state.playerCash / player.costs))} mesi di soli costi, senza contare rendite.` : "Non hai ancora costi di gestione."}</p><small>Vincolo identico per TU e Competitor. Vince il patrimonio netto a fine mese ${CONFIG.totalMonths}.</small></section>`;
}

function propertyRow(p) {
  return `<article class="property-row">${imageHtml(p)}<div class="row-name"><span class="eyebrow">${p.categoria}</span><h3><button class="row-inspect" data-detail="${p.id}">${p.nome} <span aria-hidden="true">↗</span></button></h3>${badge(p.rischio)}</div><div class="row-metric"><span>Valore attuale</span><strong>${formatSolari(p.valore)}</strong></div><div class="row-metric"><span>Netto / mese</span><strong class="net">+${formatSolari(netMonthly(p))}</strong><small>${formatSolari(p.rendita)} − ${formatSolari(p.costo)}</small></div></article>`;
}

function renderCpuPanel() {
  const c = totalsForOwner(state, "cpu");
  document.getElementById("cpu-panel").innerHTML =
    `<p class="panel-note">Il Competitor valuta da 0 a 3 acquisti a fine mese, ricalcolando dopo ogni acquisto e mantenendo almeno ${formatSolari(CONFIG.minimumCashReserve)} di riserva.</p><div class="cpu-stats"><div>Liquidità Competitor<strong>${formatSolari(state.cpuCash)}</strong></div><div>Immobili Competitor<strong>${c.count}</strong></div><div>Guadagno netto/mese<strong>${formatSolari(c.netIncome)}</strong></div><div>Patrimonio netto Competitor<strong>${formatSolari(c.netWorth)}</strong></div></div>`;
}

function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function renderLog() {
  const entries = state.log
    .map((entry) => {
      const match = entry.match(/^Mese (\d+) - (.*)$/);
      return {
        month: match ? Number(match[1]) : state.month,
        text: match ? match[2] : entry,
      };
    })
    .sort((a, b) => b.month - a.month);
  const recent = entries.slice(0, 3),
    older = entries.slice(3);
  const groups = new Map();
  older.forEach((e) => {
    if (!groups.has(e.month)) groups.set(e.month, []);
    groups.get(e.month).push(e.text);
  });
  document.getElementById("activity-log").innerHTML =
    `<ul id="recent-news">${recent.map((e) => `<li><span class="news-month">MESE ${e.month}</span>${escapeHtml(e.text)}</li>`).join("")}</ul>${older.length ? `<details id="news-archive"><summary>Archivio attività <span>${older.length}</span></summary>${[...groups].map(([month, items]) => `<section class="log-month"><h3>MESE ${month}</h3><ul>${items.map((x) => `<li>${escapeHtml(x)}</li>`).join("")}</ul></section>`).join("")}<p class="archive-note">Sono conservate le ultime ${CONFIG.maxLogEntries} attività della partita.</p></details>` : ""}`;
}

function renderFinal() {
  const modal = document.getElementById("final-screen");
  if (!state.gameOver || finalDismissed) {
    if (modal.open) modal.close();
    return;
  }
  const player = totalsForOwner(state, "player");
  const cpu = totalsForOwner(state, "cpu");
  modal.innerHTML = `<span class="eyebrow">Solari Market · Bilancio finale · Mese ${state.month}</span><h2 id="final-title">${state.winner === "draw" ? "Pareggio. Patrimoni alla pari." : state.winner === "player" ? "Hai vinto. La città è tua." : "Competitor vince questa sfida."}</h2><p>${state.month === CONFIG.totalMonths ? "Sessanta mesi di scelte, un patrimonio da confrontare." : "La partita si è conclusa per insolvenza."}</p>${comparisonHtml(player, cpu)}<button class="primary" id="final-new-game">Nuova partita</button><button class="text-button" id="final-review">Esamina il portafoglio</button>`;
  if (!modal.open) modal.showModal();
  document
    .getElementById("final-new-game")
    .addEventListener("click", requestNewGame);
  document.getElementById("final-review").addEventListener("click", () => {
    finalDismissed = true;
    modal.close();
    showView("portfolio");
  });
  modal.oncancel = (e) => {
    e.preventDefault();
    finalDismissed = true;
    modal.close();
    showView("portfolio");
  };
}
