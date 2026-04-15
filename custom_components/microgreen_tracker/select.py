"""Select platform for Microgreen Tracker — variety picker."""

from __future__ import annotations

from datetime import date

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN, VARIETIES
from .coordinator import MicrogreenTrackerCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up the variety select entity."""
    coordinator: MicrogreenTrackerCoordinator = entry.runtime_data
    async_add_entities([MicrogreenVarietySelect(coordinator, entry)])


class MicrogreenVarietySelect(
    CoordinatorEntity[MicrogreenTrackerCoordinator], SelectEntity
):
    """Dropdown to pick the active microgreen variety and start a grow cycle.

    Selecting a variety immediately starts a new cycle from today.
    To use a past start date, call the microgreen_tracker.start_grow service directly.
    """

    _attr_has_entity_name = True
    _attr_name = "Fajta kiválasztása"
    _attr_icon = "mdi:seed-outline"
    _attr_options = list(VARIETIES.keys())

    def __init__(
        self,
        coordinator: MicrogreenTrackerCoordinator,
        entry: ConfigEntry,
    ) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_variety_select"
        self._entry = entry

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry.entry_id)},
            name="Microgreen Tracker",
            manufacturer="Custom",
            model="Mikrozöld növesztési nyomkövető",
        )

    @property
    def current_option(self) -> str | None:
        """Return the currently active variety, or None if no cycle is running."""
        if self.coordinator.data and self.coordinator.data.get("variety"):
            return self.coordinator.data["variety"]
        return None

    async def async_select_option(self, option: str) -> None:
        """Start a new grow cycle with the chosen variety from today."""
        await self.coordinator.async_start_grow(option, date.today())
