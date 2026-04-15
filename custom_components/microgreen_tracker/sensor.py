"""Sensor platform for Microgreen Tracker."""

from __future__ import annotations

from datetime import date

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    DOMAIN,
    SENSOR_DAYS_REMAINING,
    SENSOR_HARVEST_DATE,
    SENSOR_STAGE,
    SENSOR_VARIETY,
)
from .coordinator import MicrogreenTrackerCoordinator


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up sensor entities from a config entry."""
    coordinator: MicrogreenTrackerCoordinator = entry.runtime_data
    async_add_entities(
        [
            MicrogreenStageSensor(coordinator, entry),
            MicrogreenDaysRemainingSensor(coordinator, entry),
            MicrogreenHarvestDateSensor(coordinator, entry),
            MicrogreenVarietySensor(coordinator, entry),
        ]
    )


class _MicrogreenBaseSensor(CoordinatorEntity[MicrogreenTrackerCoordinator], SensorEntity):
    """Base class shared by all Microgreen Tracker sensors."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: MicrogreenTrackerCoordinator,
        entry: ConfigEntry,
        sensor_key: str,
    ) -> None:
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}_{sensor_key}"
        self._entry = entry
        self._sensor_type = sensor_key

    @property
    def extra_state_attributes(self) -> dict:
        return {"microgreen_sensor_type": self._sensor_type}

    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry.entry_id)},
            name="Microgreen Tracker",
            manufacturer="Custom",
            model="Mikrozöld növesztési nyomkövető",
        )

    @property
    def available(self) -> bool:
        return self.coordinator.last_update_success


class MicrogreenStageSensor(_MicrogreenBaseSensor):
    """Reports the current grow stage in Hungarian."""

    _attr_name = "Jelenlegi szakasz"
    _attr_icon = "mdi:sprout"

    def __init__(
        self, coordinator: MicrogreenTrackerCoordinator, entry: ConfigEntry
    ) -> None:
        super().__init__(coordinator, entry, SENSOR_STAGE)

    @property
    def native_value(self) -> str | None:
        if self.coordinator.data:
            return self.coordinator.data.get("stage")
        return None


class MicrogreenDaysRemainingSensor(_MicrogreenBaseSensor):
    """Reports how many days remain in the current stage."""

    _attr_name = "Hátralévő napok"
    _attr_icon = "mdi:calendar-clock"
    _attr_device_class = SensorDeviceClass.DURATION
    _attr_native_unit_of_measurement = "d"

    def __init__(
        self, coordinator: MicrogreenTrackerCoordinator, entry: ConfigEntry
    ) -> None:
        super().__init__(coordinator, entry, SENSOR_DAYS_REMAINING)

    @property
    def native_value(self) -> int | None:
        if self.coordinator.data:
            return self.coordinator.data.get("days_remaining")
        return None


class MicrogreenHarvestDateSensor(_MicrogreenBaseSensor):
    """Reports the expected harvest date."""

    _attr_name = "Várható aratás"
    _attr_icon = "mdi:calendar-check"
    _attr_device_class = SensorDeviceClass.DATE

    def __init__(
        self, coordinator: MicrogreenTrackerCoordinator, entry: ConfigEntry
    ) -> None:
        super().__init__(coordinator, entry, SENSOR_HARVEST_DATE)

    @property
    def native_value(self) -> date | None:
        if self.coordinator.data:
            val = self.coordinator.data.get("harvest_date")
            if val:
                return date.fromisoformat(val)
        return None


class MicrogreenVarietySensor(_MicrogreenBaseSensor):
    """Reports the active microgreen variety."""

    _attr_name = "Aktív fajta"
    _attr_icon = "mdi:seed"

    def __init__(
        self, coordinator: MicrogreenTrackerCoordinator, entry: ConfigEntry
    ) -> None:
        super().__init__(coordinator, entry, SENSOR_VARIETY)

    @property
    def native_value(self) -> str | None:
        if self.coordinator.data:
            return self.coordinator.data.get("variety")
        return None
