/**
 * Microgreen Tracker — Lovelace Custom Card
 *
 * Displays the active microgreen grow cycle with an inline variety
 * selector, stage badge, progress bar, and a proper card editor so the
 * card can be configured through the Home Assistant UI without YAML.
 *
 * Minimum config (entity_stage is the only required field):
 *   type: custom:microgreen-tracker-card
 *   entity_stage: sensor.microgreen_tracker_jelenlegi_szakasz
 *
 * Full config (auto-filled by the card editor):
 *   entity_stage: sensor.microgreen_tracker_jelenlegi_szakasz
 *   entity_days_remaining: sensor.microgreen_tracker_hatralevo_napok
 *   entity_harvest_date: sensor.microgreen_tracker_varhato_aratas
 *   entity_variety: sensor.microgreen_tracker_aktiv_fajta
 *   entity_variety_select: select.microgreen_tracker_fajta_kivalasztasa
 */

// ---------------------------------------------------------------------------
// Variety list (mirrors const.py — update both if you add varieties)
// ---------------------------------------------------------------------------
const VARIETIES = [
  "Amaránt", "Bazsalikom", "Bíborhere", "Borágó", "Brokkoli",
  "Búza", "Cékla fajták", "Fodros kel", "Görögszéna", "Hagymafélék",
  "Karalábé", "Komatsuna", "Koriander", "Kukorica", "Mizuna",
  "Mustár, Fehér", "Mustár fajták", "Napraforgó", "Pak Choi", "Repce",
  "Retek fajták", "Rukkola", "Sarkantyúka", "Sárgadinnye", "Tatsoi",
  "Vajrépa", "Vöröskáposzta", "Zöldborsó", "Zsázsa",
  "Ázsia mix", "Pikáns mix", "Saláta mix",
];

// ---------------------------------------------------------------------------
// Stage styling
// ---------------------------------------------------------------------------
const STAGE_STYLES = {
  "sötétidő": { bg: "#1a1a2e", color: "#e0e0e0", icon: "🌑", label: "Sötétidő" },
  "napozás":  { bg: "#f9c74f", color: "#1a1a1a", icon: "☀️",  label: "Napozás"  },
  "aratás":   { bg: "#52b788", color: "#ffffff", icon: "✂️",  label: "Aratásra kész!" },
};

// ---------------------------------------------------------------------------
// Shared CSS
// ---------------------------------------------------------------------------
const CARD_CSS = `
  :host { display: block; }
  ha-card { padding: 16px; box-sizing: border-box; }

  /* header */
  .card-header {
    font-size: 1.05em; font-weight: 600;
    margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }

  /* variety picker form */
  .form-label {
    font-size: 0.8em; font-weight: 500;
    color: var(--secondary-text-color);
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .variety-select {
    width: 100%; padding: 8px 10px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 6px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 1em; margin-bottom: 10px;
    box-sizing: border-box;
  }
  .date-row {
    display: flex; gap: 8px; align-items: center;
    margin-bottom: 12px;
  }
  .date-row label { font-size: 0.85em; white-space: nowrap; }
  .date-input {
    flex: 1; padding: 6px 10px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 6px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 0.95em; box-sizing: border-box;
  }
  .btn-row { display: flex; gap: 8px; }
  .btn {
    flex: 1; padding: 9px 0;
    border: none; border-radius: 6px;
    font-size: 0.95em; font-weight: 600;
    cursor: pointer; transition: opacity 0.15s;
  }
  .btn:hover { opacity: 0.85; }
  .btn-primary {
    background: var(--primary-color, #03a9f4);
    color: #fff;
  }
  .btn-secondary {
    background: var(--secondary-background-color, #eee);
    color: var(--primary-text-color);
  }

  /* active cycle display */
  .variety-name {
    font-size: 1.3em; font-weight: 700;
    text-align: center; margin-bottom: 12px;
  }
  .badge-row { display: flex; justify-content: center; margin-bottom: 14px; }
  .stage-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 16px; border-radius: 20px;
    font-weight: 600; font-size: 1em;
  }
  .progress-wrap { margin-bottom: 14px; }
  .progress-label {
    font-size: 0.72em; color: var(--secondary-text-color);
    margin-bottom: 4px;
    display: flex; justify-content: space-between;
  }
  .progress-track {
    height: 8px; border-radius: 4px;
    background: var(--divider-color, #e0e0e0); overflow: hidden;
  }
  .progress-fill {
    height: 100%; border-radius: 4px;
    background: var(--primary-color, #03a9f4);
    transition: width 0.4s ease;
  }
  .info-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 8px; margin-bottom: 12px;
  }
  .info-box {
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 8px; padding: 8px 10px;
  }
  .info-lbl {
    font-size: 0.7em; color: var(--secondary-text-color);
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2px;
  }
  .info-val { font-size: 1em; font-weight: 600; }
  .divider { border: none; border-top: 1px solid var(--divider-color, #e0e0e0); margin: 14px 0; }
`;

// ---------------------------------------------------------------------------
// Main card element
// ---------------------------------------------------------------------------
class MicrogreenTrackerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._showingForm = false; // toggle to show variety picker over active display
  }

  setConfig(config) {
    if (!config.entity_stage) {
      throw new Error("'entity_stage' is required in card config.");
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  // ---- state helpers -------------------------------------------------------

  _state(entityId) {
    if (!entityId || !this._hass) return null;
    const s = this._hass.states[entityId];
    if (!s || s.state === "unknown" || s.state === "unavailable") return null;
    return s.state;
  }

  _isActive() {
    const s = this._state(this._config.entity_stage);
    return s !== null;
  }

  // ---- service calls -------------------------------------------------------

  _startGrow(variety, startDate) {
    const data = { variety };
    if (startDate) data.start_date = startDate;
    this._hass.callService("microgreen_tracker", "start_grow", data);
    this._showingForm = false;
    this._render();
  }

  _reset() {
    this._hass.callService("microgreen_tracker", "reset", {});
    this._showingForm = false;
    this._render();
  }

  // ---- render --------------------------------------------------------------

  _render() {
    if (!this._config) return;

    const active = this._isActive();
    const showForm = this._showingForm || !active;

    const shadow = this.shadowRoot;
    shadow.innerHTML = `<style>${CARD_CSS}</style><ha-card></ha-card>`;
    const card = shadow.querySelector("ha-card");

    // Header
    const header = document.createElement("div");
    header.className = "card-header";
    header.textContent = "🌱 Mikrozöld nyomkövető";
    card.appendChild(header);

    if (showForm) {
      card.appendChild(this._buildForm(active));
    } else {
      card.appendChild(this._buildActiveDisplay());
    }
  }

  // ---- variety picker form -------------------------------------------------

  _buildForm(hasActiveCycle) {
    const frag = document.createDocumentFragment();

    // Variety dropdown
    const lbl = document.createElement("div");
    lbl.className = "form-label";
    lbl.textContent = "Mikrozöld fajta";
    frag.appendChild(lbl);

    const sel = document.createElement("select");
    sel.className = "variety-select";
    // Pre-select the currently active variety if there is one
    const currentVariety = this._state(this._config.entity_variety_select)
      || this._state(this._config.entity_variety);
    VARIETIES.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      if (v === currentVariety) opt.selected = true;
      sel.appendChild(opt);
    });
    frag.appendChild(sel);

    // Optional start date row
    const dateRow = document.createElement("div");
    dateRow.className = "date-row";
    const dateLbl = document.createElement("label");
    dateLbl.textContent = "Ültetés dátuma:";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "date-input";
    dateInput.value = new Date().toISOString().slice(0, 10); // default today
    dateRow.appendChild(dateLbl);
    dateRow.appendChild(dateInput);
    frag.appendChild(dateRow);

    // Buttons
    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";

    const startBtn = document.createElement("button");
    startBtn.className = "btn btn-primary";
    startBtn.textContent = "Indítás";
    startBtn.addEventListener("click", () => {
      const today = new Date().toISOString().slice(0, 10);
      const chosenDate = dateInput.value !== today ? dateInput.value : undefined;
      this._startGrow(sel.value, chosenDate);
    });
    btnRow.appendChild(startBtn);

    if (hasActiveCycle) {
      // "Cancel" just goes back to the active display without resetting
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn btn-secondary";
      cancelBtn.textContent = "Mégse";
      cancelBtn.addEventListener("click", () => {
        this._showingForm = false;
        this._render();
      });
      btnRow.appendChild(cancelBtn);
    }

    frag.appendChild(btnRow);
    return frag;
  }

  // ---- active cycle display ------------------------------------------------

  _buildActiveDisplay() {
    const frag = document.createDocumentFragment();

    const stage    = this._state(this._config.entity_stage);
    const daysLeft = this._state(this._config.entity_days_remaining);
    const harvest  = this._state(this._config.entity_harvest_date);
    const variety  = this._state(this._config.entity_variety);

    const style = STAGE_STYLES[stage] || STAGE_STYLES["napozás"];

    // Variety name
    if (variety) {
      const vDiv = document.createElement("div");
      vDiv.className = "variety-name";
      vDiv.textContent = variety;
      frag.appendChild(vDiv);
    }

    // Stage badge
    const badgeRow = document.createElement("div");
    badgeRow.className = "badge-row";
    const badge = document.createElement("div");
    badge.className = "stage-badge";
    badge.style.cssText = `background:${style.bg}; color:${style.color};`;
    badge.textContent = `${style.icon} ${style.label}`;
    badgeRow.appendChild(badge);
    frag.appendChild(badgeRow);

    // Progress bar (rough: sötétidő=20%, napozás=60%, aratás=100%)
    const pct = stage === "aratás" ? 100 : stage === "napozás" ? 60 : 20;
    const progressWrap = document.createElement("div");
    progressWrap.className = "progress-wrap";
    progressWrap.innerHTML = `
      <div class="progress-label"><span>Ültetés</span><span>Aratás</span></div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>`;
    frag.appendChild(progressWrap);

    // Info boxes
    const harvestDisplay = harvest
      ? harvest.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1. $2. $3.")
      : "—";
    const grid = document.createElement("div");
    grid.className = "info-grid";
    grid.innerHTML = `
      <div class="info-box">
        <div class="info-lbl">Hátralévő napok</div>
        <div class="info-val">${daysLeft !== null ? daysLeft + " nap" : "—"}</div>
      </div>
      <div class="info-box">
        <div class="info-lbl">Várható aratás</div>
        <div class="info-val">${harvestDisplay}</div>
      </div>`;
    frag.appendChild(grid);

    // Action buttons
    const hr = document.createElement("hr");
    hr.className = "divider";
    frag.appendChild(hr);

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";

    const changeBtn = document.createElement("button");
    changeBtn.className = "btn btn-secondary";
    changeBtn.textContent = "Új ciklus";
    changeBtn.addEventListener("click", () => {
      this._showingForm = true;
      this._render();
    });
    btnRow.appendChild(changeBtn);

    const resetBtn = document.createElement("button");
    resetBtn.className = "btn btn-secondary";
    resetBtn.textContent = "Visszaállítás";
    resetBtn.addEventListener("click", () => this._reset());
    btnRow.appendChild(resetBtn);

    frag.appendChild(btnRow);
    return frag;
  }

  // ---- card picker integration ---------------------------------------------

  static getConfigElement() {
    return document.createElement("microgreen-tracker-card-editor");
  }

  static getStubConfig() {
    return {
      entity_stage:          "sensor.microgreen_tracker_jelenlegi_szakasz",
      entity_days_remaining: "sensor.microgreen_tracker_hatralevo_napok",
      entity_harvest_date:   "sensor.microgreen_tracker_varhato_aratas",
      entity_variety:        "sensor.microgreen_tracker_aktiv_fajta",
      entity_variety_select: "select.microgreen_tracker_fajta_kivalasztasa",
    };
  }
}

customElements.define("microgreen-tracker-card", MicrogreenTrackerCard);

// ---------------------------------------------------------------------------
// Card editor (shown in the HA "Edit card" drawer)
// ---------------------------------------------------------------------------
const EDITOR_CSS = `
  .field { margin-bottom: 14px; }
  label  { display: block; font-size: 0.85em; font-weight: 500; margin-bottom: 4px; }
  input  {
    width: 100%; box-sizing: border-box;
    padding: 7px 10px;
    border: 1px solid var(--divider-color, #ccc);
    border-radius: 6px;
    background: var(--card-background-color, #fff);
    color: var(--primary-text-color);
    font-size: 0.95em;
  }
  .hint { font-size: 0.75em; color: var(--secondary-text-color); margin-top: 2px; }
`;

const EDITOR_FIELDS = [
  {
    key: "entity_stage",
    label: "Szakasz szenzor *",
    hint: "pl. sensor.microgreen_tracker_jelenlegi_szakasz",
  },
  {
    key: "entity_days_remaining",
    label: "Hátralévő napok szenzor",
    hint: "pl. sensor.microgreen_tracker_hatralevo_napok",
  },
  {
    key: "entity_harvest_date",
    label: "Aratás dátuma szenzor",
    hint: "pl. sensor.microgreen_tracker_varhato_aratas",
  },
  {
    key: "entity_variety",
    label: "Aktív fajta szenzor",
    hint: "pl. sensor.microgreen_tracker_aktiv_fajta",
  },
  {
    key: "entity_variety_select",
    label: "Fajta kiválasztása (select entitás)",
    hint: "pl. select.microgreen_tracker_fajta_kivalasztasa",
  },
];

class MicrogreenTrackerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  // hass is passed in but not needed for a plain text-field editor
  set hass(_hass) {}

  _render() {
    this.shadowRoot.innerHTML = `<style>${EDITOR_CSS}</style>`;
    EDITOR_FIELDS.forEach(({ key, label, hint }) => {
      const wrap = document.createElement("div");
      wrap.className = "field";

      const lbl = document.createElement("label");
      lbl.textContent = label;
      wrap.appendChild(lbl);

      const input = document.createElement("input");
      input.type = "text";
      input.value = this._config[key] || "";
      input.placeholder = hint;
      input.dataset.key = key;
      input.addEventListener("change", (e) => this._valueChanged(e));
      wrap.appendChild(input);

      const hintDiv = document.createElement("div");
      hintDiv.className = "hint";
      hintDiv.textContent = hint;
      wrap.appendChild(hintDiv);

      this.shadowRoot.appendChild(wrap);
    });
  }

  _valueChanged(e) {
    const key = e.target.dataset.key;
    this._config = { ...this._config, [key]: e.target.value.trim() };
    this.dispatchEvent(
      new CustomEvent("config-changed", { detail: { config: this._config } })
    );
  }
}

customElements.define("microgreen-tracker-card-editor", MicrogreenTrackerCardEditor);

// ---------------------------------------------------------------------------
// Register card in HA card picker
// ---------------------------------------------------------------------------
window.customCards = window.customCards || [];
window.customCards.push({
  type: "microgreen-tracker-card",
  name: "Microgreen Tracker",
  description: "Mikrozöld növesztési ciklus nyomkövetése",
  preview: true,
  documentationURL: "https://github.com/aaronhorv/microgreen-tracker",
});
