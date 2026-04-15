"""Microgreen Tracker — Home Assistant custom integration."""

from __future__ import annotations

import logging
import pathlib
from datetime import date

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv

from .const import (
    ATTR_START_DATE,
    ATTR_VARIETY,
    DOMAIN,
    SERVICE_RESET,
    SERVICE_START_GROW,
    VARIETIES,
)
from .coordinator import MicrogreenTrackerCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor", "select"]

START_GROW_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_VARIETY): vol.In(list(VARIETIES.keys())),
        vol.Optional(ATTR_START_DATE): cv.date,
    }
)

RESET_SCHEMA = vol.Schema({})


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Serve the Lovelace card JS as a static file."""
    www_path = str(
        pathlib.Path(__file__).parent / "www" / "microgreen-tracker-card.js"
    )
    card_url = "/microgreen_tracker/microgreen-tracker-card.js"

    # HA 2024.4+ uses async_register_static_paths + StaticPathConfig.
    # Older versions use the synchronous register_static_path.
    # Both are tried so the integration works across a wide HA version range.
    try:
        from homeassistant.components.http import StaticPathConfig  # noqa: PLC0415
        await hass.http.async_register_static_paths(
            [StaticPathConfig(card_url, www_path, False)]
        )
    except Exception:  # noqa: BLE001
        try:
            hass.http.register_static_path(card_url, www_path, cache_headers=False)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Could not register Lovelace card static path: %s", err)

    # add_extra_js_url auto-registers the card as a Lovelace resource.
    # It was removed in HA 2025.x; if unavailable the user must add the
    # resource manually once via Settings → Dashboards → Resources.
    try:
        from homeassistant.components.frontend import add_extra_js_url  # noqa: PLC0415
        add_extra_js_url(hass, card_url)
    except Exception:  # noqa: BLE001
        _LOGGER.info(
            "Add the Microgreen Tracker card resource manually: "
            "Settings → Dashboards → Resources → Add resource → "
            "URL: %s  Type: JavaScript Module",
            card_url,
        )

    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Microgreen Tracker from a config entry."""
    coordinator = MicrogreenTrackerCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()

    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    _async_register_services(hass)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)


def _async_register_services(hass: HomeAssistant) -> None:
    """Register integration services (idempotent)."""
    if hass.services.has_service(DOMAIN, SERVICE_START_GROW):
        return

    def _get_coordinator() -> MicrogreenTrackerCoordinator:
        entries = hass.config_entries.async_entries(DOMAIN)
        if not entries:
            raise HomeAssistantError("Microgreen Tracker is not configured.")
        return entries[0].runtime_data

    async def handle_start_grow(call: ServiceCall) -> None:
        variety: str = call.data[ATTR_VARIETY]
        start_date: date = call.data.get(ATTR_START_DATE, date.today())
        coordinator = _get_coordinator()
        await coordinator.async_start_grow(variety, start_date)

    async def handle_reset(call: ServiceCall) -> None:
        coordinator = _get_coordinator()
        await coordinator.async_reset()

    hass.services.async_register(
        DOMAIN, SERVICE_START_GROW, handle_start_grow, schema=START_GROW_SCHEMA
    )
    hass.services.async_register(
        DOMAIN, SERVICE_RESET, handle_reset, schema=RESET_SCHEMA
    )

