/**
 * Microgreen Tracker — Lovelace Custom Card
 *
 * Displays the active microgreen grow cycle with stage badge,
 * progress bar, days remaining, and expected harvest date.
 *
 * Config:
 *   type: custom:microgreen-tracker-card
 *   entity_stage: sensor.microgreen_tracker_jelenlegi_szakasz
 *   entity_days_remaining: sensor.microgreen_tracker_hatralevo_napok
 *   entity_harvest_date: sensor.microgreen_tracker_varhato_aratas
 *   entity_variety: sensor.microgreen_tracker_aktiv_fajta
 */

const STAGE_STYLES = {
  sötétidő: {
    bg: "#1a1a2e",
    color: "#e0e0e0",
    icon: "🌑",
    label: "Sötétidő",
  },
  napozás: {
    bg: "#f9c74f",
    color: "#1a1a1a",
    icon: "☀️",
    label: "Napozás",
  },
  aratás: {
    bg: "#52b788",
    color: "#ffffff",
    icon: "✂️",
    label: "Aratásra kész!",
  },
};

const CARD_CSS = `
  :host {
    display: block;
  }
  ha-card {
    padding: 16px;
    box-sizing: border-box;
  }
  .card-header {
    font-size: 1.1em;
    font-weight: 600;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .inactive {
    color: var(--secondary-text-color);
    font-style: italic;
    text-align: center;
    padding: 16px 0;
  }
  .variety-row {
    font-size: 1.3em;
    font-weight: 700;
    margin-bottom: 12px;
    text-align: center;
  }
  .stage-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 1em;
    margin: 0 auto 14px;
    width: fit-content;
  }
  .badge-row {
    display: flex;
    justify-content: center;
    margin-bottom: 14px;
  }
  .progress-wrap {
    margin-bottom: 14px;
  }
  .progress-label {
    font-size: 0.75em;
    color: var(--secondary-text-color);
    margin-bottom: 4px;
    display: flex;
    justify-content: space-between;
  }
  .progress-track {
    height: 8px;
    border-radius: 4px;
    background: var(--divider-color, #e0e0e0);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 4px;
    background: var(--primary-color, #03a9f4);
    transition: width 0.4s ease;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .info-box {
    background: var(--secondary-background-color, #f5f5f5);
    border-radius: 8px;
    padding: 8px 10px;
  }
  .info-label {
    font-size: 0.7em;
    color: var(--secondary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }
  .info-value {
    font-size: 1em;
    font-weight: 600;
  }
`;

class MicrogreenTrackerCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config) {
    if (!config.entity_stage) {
      throw new Error("entity_stage is required in card config.");
    }
    this._config = config;
    this._render(null, null, null, null);
  }

  set hass(hass) {
    this._hass = hass;
    const stage = hass.states[this._config.entity_stage];
    const daysLeft = this._config.entity_days_remaining
      ? hass.states[this._config.entity_days_remaining]
      : null;
    const harvestDate = this._config.entity_harvest_date
      ? hass.states[this._config.entity_harvest_date]
      : null;
    const variety = this._config.entity_variety
      ? hass.states[this._config.entity_variety]
      : null;
    this._render(stage, daysLeft, harvestDate, variety);
  }

  _render(stageEntity, daysLeftEntity, harvestDateEntity, varietyEntity) {
    const stageVal = stageEntity ? stageEntity.state : null;
    const isActive =
      stageVal && stageVal !== "unknown" && stageVal !== "unavailable";

    const daysLeft =
      daysLeftEntity &&
      daysLeftEntity.state !== "unknown" &&
      daysLeftEntity.state !== "unavailable"
        ? parseInt(daysLeftEntity.state, 10)
        : null;

    const harvestDate =
      harvestDateEntity &&
      harvestDateEntity.state !== "unknown" &&
      harvestDateEntity.state !== "unavailable"
        ? harvestDateEntity.state
        : null;

    const varietyName =
      varietyEntity &&
      varietyEntity.state !== "unknown" &&
      varietyEntity.state !== "unavailable"
        ? varietyEntity.state
        : null;

    // Compute progress percentage from days_remaining attribute fallback
    let pct = 0;
    if (isActive && stageEntity) {
      const attrs = stageEntity.attributes || {};
      // Try to get days_elapsed / harvest_day from sensor attributes if available
      // Otherwise, derive from days_remaining for a rough fill
      if (attrs.days_elapsed !== undefined && attrs.harvest_day !== undefined) {
        pct = Math.min(
          100,
          Math.round((attrs.days_elapsed / attrs.harvest_day) * 100)
        );
      } else if (daysLeft !== null && harvestDate) {
        // Rough estimate: assume stageVal tells us how far along
        if (stageVal === "aratás") pct = 100;
        else if (stageVal === "napozás") pct = 60;
        else pct = 20;
      }
    }

    const style = isActive
      ? STAGE_STYLES[stageVal] || STAGE_STYLES["napozás"]
      : null;

    const harvestDisplay = harvestDate
      ? harvestDate.replace(
          /^(\d{4})-(\d{2})-(\d{2})$/,
          "$1. $2. $3."
        )
      : "—";

    this.shadowRoot.innerHTML = `
      <style>${CARD_CSS}</style>
      <ha-card>
        <div class="card-header">🌱 Mikrozöld nyomkövető</div>
        ${
          !isActive
            ? `<div class="inactive">Nincs aktív növesztési ciklus.<br>Indíts egy újat a <em>microgreen_tracker.start_grow</em> szolgáltatással.</div>`
            : `
          <div class="variety-row">${varietyName || "—"}</div>

          <div class="badge-row">
            <div class="stage-badge" style="background:${style.bg}; color:${style.color};">
              <span>${style.icon}</span>
              <span>${style.label}</span>
            </div>
          </div>

          <div class="progress-wrap">
            <div class="progress-label">
              <span>Ültetés</span>
              <span>Aratás</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${pct}%"></div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-box">
              <div class="info-label">Hátralévő napok</div>
              <div class="info-value">${daysLeft !== null ? daysLeft + " nap" : "—"}</div>
            </div>
            <div class="info-box">
              <div class="info-label">Várható aratás</div>
              <div class="info-value">${harvestDisplay}</div>
            </div>
          </div>
        `
        }
      </ha-card>
    `;
  }

  static getConfigElement() {
    // Minimal editor — returns a plain element; a real editor card can be added later
    return document.createElement("div");
  }

  static getStubConfig() {
    return {
      entity_stage: "sensor.microgreen_tracker_jelenlegi_szakasz",
      entity_days_remaining: "sensor.microgreen_tracker_hatralevo_napok",
      entity_harvest_date: "sensor.microgreen_tracker_varhato_aratas",
      entity_variety: "sensor.microgreen_tracker_aktiv_fajta",
    };
  }
}

customElements.define("microgreen-tracker-card", MicrogreenTrackerCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "microgreen-tracker-card",
  name: "Microgreen Tracker",
  description: "Mikrozöld növesztési ciklus megjelenítése",
  preview: true,
});
