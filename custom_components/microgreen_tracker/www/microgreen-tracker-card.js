/**
 * Microgreen Tracker — Lovelace Custom Card
 *
 * Installed and registered automatically by the integration — no manual
 * resource step needed.
 *
 * Minimal YAML config (entities are auto-discovered):
 *   type: custom:microgreen-tracker-card
 *
 * The card finds all integration entities by reading their
 * `microgreen_sensor_type` state attribute, so no entity IDs are needed.
 */

// ---------------------------------------------------------------------------
// Variety list (mirrors const.py VARIETIES)
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
  "sötétidő": { bg: "#1a1a2e", color: "#e0e0e0", icon: "🌑", label: "Sötétidő"       },
  "napozás":  { bg: "#f9c74f", color: "#1a1a1a", icon: "☀️",  label: "Napozás"        },
  "aratás":   { bg: "#52b788", color: "#ffffff", icon: "✂️",  label: "Aratásra kész!" },
};

// ---------------------------------------------------------------------------
// Auto-discovery helper — shared by card and editor
// ---------------------------------------------------------------------------
function discoverEntities(hass) {
  /**
   * Scans hass.states for entities that carry a `microgreen_sensor_type`
   * attribute and returns a map:
   *   { stage, days_remaining, harvest_date, variety, variety_select,
   *     stage_entity_id, days_remaining_entity_id, ... }
   * Values are the current state string, or null if unavailable.
   */
  const map = {};
  for (const [entityId, stateObj] of Object.entries(hass.states)) {
    const t = stateObj.attributes?.microgreen_sensor_type;
    if (!t) continue;
    const s = stateObj.state;
    map[t] = (s === "unknown" || s === "unavailable") ? null : s;
    map[`${t}_entity_id`] = entityId;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Shared CSS
// ---------------------------------------------------------------------------
const CARD_CSS = `
  :host { display: block; }
  ha-card { padding: 16px; box-sizing: border-box; }

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
  .btn-primary  { background: var(--primary-color, #03a9f4); color: #fff; }
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
  .divider {
    border: none; border-top: 1px solid var(--divider-color, #e0e0e0);
    margin: 14px 0;
  }
  .no-integration {
    color: var(--secondary-text-color); font-style: italic;
    text-align: center; padding: 16px 0; font-size: 0.9em;
  }
`;

// ---------------------------------------------------------------------------
// Main card element
// ---------------------------------------------------------------------------
class MicrogreenTrackerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._showingForm = false;
  }

  setConfig(config) {
    // No required fields — card is zero-config.
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
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
    if (!this._config || !this._hass) return;

    const e = discoverEntities(this._hass);
    const active = e.stage !== null && e.stage !== undefined;
    const showForm = this._showingForm || !active;

    const shadow = this.shadowRoot;
    shadow.innerHTML = `<style>${CARD_CSS}</style><ha-card></ha-card>`;
    const card = shadow.querySelector("ha-card");

    const header = document.createElement("div");
    header.className = "card-header";
    header.textContent = "🌱 Mikrozöld nyomkövető";
    card.appendChild(header);

    // If the integration isn't set up yet, show a hint
    if (!e.stage_entity_id && !e.variety_select_entity_id) {
      const hint = document.createElement("div");
      hint.className = "no-integration";
      hint.textContent =
        "A Microgreen Tracker integráció nincs beállítva. " +
        "Menj a Beállítások → Eszközök és Szolgáltatások menüpontra a telepítéshez.";
      card.appendChild(hint);
      return;
    }

    if (showForm) {
      card.appendChild(this._buildForm(active, e));
    } else {
      card.appendChild(this._buildActiveDisplay(e));
    }
  }

  // ---- variety picker form -------------------------------------------------

  _buildForm(hasActiveCycle, e) {
    const frag = document.createDocumentFragment();

    // Variety dropdown label
    const lbl = document.createElement("div");
    lbl.className = "form-label";
    lbl.textContent = "Mikrozöld fajta";
    frag.appendChild(lbl);

    // Variety select
    const sel = document.createElement("select");
    sel.className = "variety-select";
    const currentVariety = e.variety_select || e.variety;
    VARIETIES.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      if (v === currentVariety) opt.selected = true;
      sel.appendChild(opt);
    });
    frag.appendChild(sel);

    // Optional start date
    const dateRow = document.createElement("div");
    dateRow.className = "date-row";
    const dateLbl = document.createElement("label");
    dateLbl.textContent = "Ültetés dátuma:";
    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.className = "date-input";
    dateInput.value = new Date().toISOString().slice(0, 10);
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

  _buildActiveDisplay(e) {
    const frag = document.createDocumentFragment();

    const stage    = e.stage;
    const daysLeft = e.days_remaining;
    const harvest  = e.harvest_date;
    const variety  = e.variety;
    const style    = STAGE_STYLES[stage] || STAGE_STYLES["napozás"];

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

    // Progress bar
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
    return {};
  }
}

customElements.define("microgreen-tracker-card", MicrogreenTrackerCard);

// ---------------------------------------------------------------------------
// Card editor — shows auto-discovered entities (read-only, no inputs needed)
// ---------------------------------------------------------------------------
const EDITOR_CSS = `
  .title {
    font-size: 0.85em; font-weight: 600; margin-bottom: 10px;
    color: var(--secondary-text-color); text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .entity-row {
    display: flex; justify-content: space-between; align-items: baseline;
    padding: 7px 0;
    border-bottom: 1px solid var(--divider-color, #e0e0e0);
    font-size: 0.85em; gap: 8px;
  }
  .entity-row:last-child { border-bottom: none; }
  .entity-type { color: var(--secondary-text-color); white-space: nowrap; }
  .entity-id   { font-family: monospace; color: var(--primary-text-color); word-break: break-all; }
  .not-found   { color: var(--error-color, #c62828); font-style: italic; }
  .hint {
    margin-top: 12px; padding: 10px; border-radius: 6px;
    background: var(--secondary-background-color, #f5f5f5);
    font-size: 0.8em; color: var(--secondary-text-color); line-height: 1.4;
  }
`;

const DISCOVERY_KEYS = [
  { key: "stage",           label: "Szakasz szenzor"    },
  { key: "days_remaining",  label: "Hátralévő napok"    },
  { key: "harvest_date",    label: "Aratás dátuma"      },
  { key: "variety",         label: "Aktív fajta"        },
  { key: "variety_select",  label: "Fajta kiválasztása" },
];

class MicrogreenTrackerCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;
    const found = discoverEntities(this._hass);
    const shadow = this.shadowRoot;
    shadow.innerHTML = `<style>${EDITOR_CSS}</style>`;

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = "Automatikusan felismert entitások";
    shadow.appendChild(title);

    DISCOVERY_KEYS.forEach(({ key, label }) => {
      const row = document.createElement("div");
      row.className = "entity-row";

      const typeSpan = document.createElement("span");
      typeSpan.className = "entity-type";
      typeSpan.textContent = label;

      const idSpan = document.createElement("span");
      const entityId = found[`${key}_entity_id`];
      if (entityId) {
        idSpan.className = "entity-id";
        idSpan.textContent = entityId;
      } else {
        idSpan.className = "not-found";
        idSpan.textContent = "nem található";
      }

      row.appendChild(typeSpan);
      row.appendChild(idSpan);
      shadow.appendChild(row);
    });

    const hint = document.createElement("div");
    hint.className = "hint";
    hint.textContent =
      "Nincs szükség konfigurációra — a kártya automatikusan megtalálja " +
      "a Microgreen Tracker entitásokat. Ha valamelyik entitás hiányzik, " +
      "ellenőrizd, hogy az integráció be van-e állítva.";
    shadow.appendChild(hint);
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
  description: "Mikrozöld növesztési ciklus nyomkövetése — konfiguráció nélkül",
  preview: true,
  documentationURL: "https://github.com/aaronhorv/microgreen-tracker",
});
