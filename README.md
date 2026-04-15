# Microgreen Tracker

Hungarian-language Home Assistant HACS custom integration for tracking a single microgreen grow tray through three stages.

## Szakaszok / Stages

| Szakasz | Leírás |
|---|---|
| **sötétidő** | A tálca sötétben csírázik |
| **napozás** | A palánták fényre kerülnek |
| **aratás** | Betakarításra kész |

Stage transitions happen automatically based on the planting date and variety timing data.

## Telepítés / Installation

1. Add this repository to HACS as a **custom repository** → Integration category.
2. Install "Microgreen Tracker" from HACS.
3. Restart Home Assistant.
4. Go to **Settings → Devices & Services → Add Integration** and search for "Microgreen Tracker".
5. Enter your notification target (e.g. `persistent_notification` or `mobile_app_your_phone`).

## Lovelace kártya / Lovelace Card

The card JS file is served automatically at:
```
/microgreen_tracker/microgreen-tracker-card.js
```

On **HA 2024.x** the resource is registered automatically — no extra steps needed.

On **HA 2025+** you need to add the resource once:

1. **Settings → Dashboards → ⋮ (top-right) → Resources → Add resource**
2. URL: `/microgreen_tracker/microgreen-tracker-card.js`
3. Type: **JavaScript Module**
4. Save, then reload the browser.

After that, add the card to any dashboard:

```yaml
type: custom:microgreen-tracker-card
```

Or search for **Microgreen Tracker** in the visual card picker (**Edit Dashboard → Add Card**).

The card auto-discovers all integration entities — no entity IDs required.

## Szolgáltatások / Services

### `microgreen_tracker.start_grow`

Elindít egy új növesztési ciklust.

| Mező | Típus | Kötelező | Leírás |
|---|---|---|---|
| `variety` | string | igen | Fajta neve (l. lent) |
| `start_date` | date | nem | Ültetés dátuma (alapértelmezett: ma) |

### `microgreen_tracker.reset`

Törli az aktív ciklust.

## Szenzor entitások / Sensor Entities

| Entitás | Leírás |
|---|---|
| `sensor.microgreen_tracker_jelenlegi_szakasz` | Aktuális szakasz |
| `sensor.microgreen_tracker_hatralevo_napok` | Hátralévő napok a következő szakaszig |
| `sensor.microgreen_tracker_varhato_aratas` | Várható aratás dátuma |
| `sensor.microgreen_tracker_aktiv_fajta` | Aktív fajta neve |

## Fajták / Varieties

| Fajta | Sötétidő (nap) | Aratás (nap) |
|---|---|---|
| Amaránt | 3 | 12 |
| Bazsalikom | 6 | 12 |
| Bíborhere | 3 | 8 |
| Borágó | 6 | 10 |
| Brokkoli | 3 | 10 |
| Búza | 4 | 7 |
| Cékla fajták | 5 | 12 |
| Fodros kel | 3 | 10 |
| Görögszéna | 3 | 8 |
| Hagymafélék | 6 | 16 |
| Karalábé | 3 | 10 |
| Komatsuna | 3 | 10 |
| Koriander | 5 | 16 |
| Kukorica | 7 | 7 |
| Mizuna | 3 | 10 |
| Mustár, Fehér | 3 | 8 |
| Mustár fajták | 3 | 10 |
| Napraforgó | 4 | 8 |
| Pak Choi | 3 | 10 |
| Repce | 3 | 10 |
| Retek fajták | 3 | 7 |
| Rukkola | 3 | 10 |
| Sarkantyúka | 4 | 12 |
| Sárgadinnye | 5 | 10 |
| Tatsoi | 3 | 10 |
| Vajrépa | 3 | 10 |
| Vöröskáposzta | 3 | 10 |
| Zöldborsó | 4 | 10 |
| Zsázsa | 3 | 10 |
| Ázsia mix | 3 | 8 |
| Pikáns mix | 4 | 8 |
| Saláta mix | 4 | 8 |

## Minimális követelmények / Requirements

- Home Assistant 2024.8.0+
- HACS 1.34.0+
