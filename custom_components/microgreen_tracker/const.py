"""Constants for the Microgreen Tracker integration."""

DOMAIN = "microgreen_tracker"
STORAGE_KEY = "microgreen_tracker.grow_data"
STORAGE_VERSION = 1

# Grow stage identifiers (Hungarian)
STAGE_SOTETSIDO = "sötétidő"
STAGE_NAPOZES = "napozás"
STAGE_ARATAS = "aratás"

STAGES = [STAGE_SOTETSIDO, STAGE_NAPOZES, STAGE_ARATAS]

# Config entry keys
CONF_NOTIFY_ENABLED = "notify_enabled"
CONF_NOTIFY_TARGET = "notify_target"
DEFAULT_NOTIFY_TARGET = "persistent_notification"

# Service names
SERVICE_START_GROW = "start_grow"
SERVICE_RESET = "reset"

# Service / event attribute keys
ATTR_VARIETY = "variety"
ATTR_START_DATE = "start_date"

# Sensor unique-ID suffixes
SENSOR_STAGE = "stage"
SENSOR_DAYS_REMAINING = "days_remaining"
SENSOR_HARVEST_DATE = "harvest_date"
SENSOR_VARIETY = "variety_name"

# Variety catalogue: name → {dark_days, harvest_day}
# dark_days  = days the tray spends covered / in darkness (sötétidő)
# harvest_day = total days from planting until harvest (napozás ends at harvest_day)
VARIETIES: dict[str, dict[str, int]] = {
    "Amaránt":       {"dark_days": 3, "harvest_day": 12},
    "Bazsalikom":    {"dark_days": 6, "harvest_day": 12},
    "Bíborhere":     {"dark_days": 3, "harvest_day":  8},
    "Borágó":        {"dark_days": 6, "harvest_day": 10},
    "Brokkoli":      {"dark_days": 3, "harvest_day": 10},
    "Búza":          {"dark_days": 4, "harvest_day":  7},
    "Cékla fajták":  {"dark_days": 5, "harvest_day": 12},
    "Fodros kel":    {"dark_days": 3, "harvest_day": 10},
    "Görögszéna":    {"dark_days": 3, "harvest_day":  8},
    "Hagymafélék":   {"dark_days": 6, "harvest_day": 16},
    "Karalábé":      {"dark_days": 3, "harvest_day": 10},
    "Komatsuna":     {"dark_days": 3, "harvest_day": 10},
    "Koriander":     {"dark_days": 5, "harvest_day": 16},
    "Kukorica":      {"dark_days": 7, "harvest_day":  7},
    "Mizuna":        {"dark_days": 3, "harvest_day": 10},
    "Mustár, Fehér": {"dark_days": 3, "harvest_day":  8},
    "Mustár fajták": {"dark_days": 3, "harvest_day": 10},
    "Napraforgó":    {"dark_days": 4, "harvest_day":  8},
    "Pak Choi":      {"dark_days": 3, "harvest_day": 10},
    "Repce":         {"dark_days": 3, "harvest_day": 10},
    "Retek fajták":  {"dark_days": 3, "harvest_day":  7},
    "Rukkola":       {"dark_days": 3, "harvest_day": 10},
    "Sarkantyúka":   {"dark_days": 4, "harvest_day": 12},
    "Sárgadinnye":   {"dark_days": 5, "harvest_day": 10},
    "Tatsoi":        {"dark_days": 3, "harvest_day": 10},
    "Vajrépa":       {"dark_days": 3, "harvest_day": 10},
    "Vöröskáposzta": {"dark_days": 3, "harvest_day": 10},
    "Zöldborsó":     {"dark_days": 4, "harvest_day": 10},
    "Zsázsa":        {"dark_days": 3, "harvest_day": 10},
    "Ázsia mix":     {"dark_days": 3, "harvest_day":  8},
    "Pikáns mix":    {"dark_days": 4, "harvest_day":  8},
    "Saláta mix":    {"dark_days": 4, "harvest_day":  8},
}
