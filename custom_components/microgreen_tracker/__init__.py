"""Microgreen Tracker — Home Assistant custom integration."""

from __future__ import annotations

import logging
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

PLATFORMS = ["sensor"]

START_GROW_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_VARIETY): vol.In(list(VARIETIES.keys())),
        vol.Optional(ATTR_START_DATE): cv.date,
    }
)

RESET_SCHEMA = vol.Schema({})


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

