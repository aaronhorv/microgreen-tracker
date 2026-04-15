"""DataUpdateCoordinator for Microgreen Tracker."""

from __future__ import annotations

import logging
from datetime import date, timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import (
    ATTR_START_DATE,
    ATTR_VARIETY,
    CONF_NOTIFY_ENABLED,
    CONF_NOTIFY_TARGET,
    DEFAULT_NOTIFY_TARGET,
    DOMAIN,
    STAGE_ARATAS,
    STAGE_NAPOZES,
    STAGE_SOTETSIDO,
    STORAGE_KEY,
    STORAGE_VERSION,
    VARIETIES,
)

_LOGGER = logging.getLogger(__name__)

# Empty snapshot returned when no grow cycle is active
_EMPTY_SNAPSHOT: dict = {
    "active": False,
    "variety": None,
    "start_date": None,
    "stage": None,
    "days_elapsed": None,
    "days_remaining": None,
    "harvest_date": None,
}


class MicrogreenTrackerCoordinator(DataUpdateCoordinator):
    """Manages state for a single microgreen grow tray."""

    def __init__(self, hass: HomeAssistant, config_entry: ConfigEntry) -> None:
        super().__init__(
            hass,
            _LOGGER,
            config_entry=config_entry,
            name=DOMAIN,
            update_interval=timedelta(hours=1),
        )
        self._store: Store[dict] = Store(hass, STORAGE_VERSION, STORAGE_KEY)

        def _cfg(key, default):
            return config_entry.options.get(key, config_entry.data.get(key, default))

        self._notify_enabled: bool = _cfg(CONF_NOTIFY_ENABLED, True)
        self._notify_target: str = _cfg(CONF_NOTIFY_TARGET, DEFAULT_NOTIFY_TARGET)
        self.grow_data: dict = {}

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def _async_setup(self) -> None:
        """Load persisted grow data from storage (called once before first poll)."""
        stored = await self._store.async_load()
        self.grow_data = stored if isinstance(stored, dict) else {}
        _LOGGER.debug("Loaded grow data from storage: %s", self.grow_data)

    async def _async_update_data(self) -> dict:
        """Compute the current snapshot and fire stage-change notifications."""
        if not self.grow_data.get(ATTR_VARIETY):
            return dict(_EMPTY_SNAPSHOT)

        variety: str = self.grow_data[ATTR_VARIETY]
        start_date: date = date.fromisoformat(self.grow_data[ATTR_START_DATE])

        stage, days_elapsed, days_remaining, harvest_date = self._compute_stage(
            variety, start_date
        )

        last_notified = self.grow_data.get("last_notified_stage")
        if stage != last_notified:
            await self._async_notify_stage_change(
                variety, stage, days_elapsed, harvest_date
            )
            self.grow_data["last_notified_stage"] = stage
            await self._store.async_save(self.grow_data)

        return {
            "active": True,
            "variety": variety,
            "start_date": self.grow_data[ATTR_START_DATE],
            "stage": stage,
            "days_elapsed": days_elapsed,
            "days_remaining": days_remaining,
            "harvest_date": harvest_date.isoformat(),
        }

    # ------------------------------------------------------------------
    # Stage computation
    # ------------------------------------------------------------------

    def _compute_stage(
        self, variety: str, start_date: date
    ) -> tuple[str, int, int, date]:
        """Return (stage, days_elapsed, days_remaining, harvest_date)."""
        today = date.today()
        days_elapsed = (today - start_date).days
        dark_days = VARIETIES[variety]["dark_days"]
        harvest_day = VARIETIES[variety]["harvest_day"]

        if days_elapsed < dark_days:
            stage = STAGE_SOTETSIDO
            days_remaining = dark_days - days_elapsed
        elif days_elapsed < harvest_day:
            stage = STAGE_NAPOZES
            days_remaining = harvest_day - days_elapsed
        else:
            stage = STAGE_ARATAS
            days_remaining = 0

        harvest_date = start_date + timedelta(days=harvest_day)
        return stage, days_elapsed, days_remaining, harvest_date

    # ------------------------------------------------------------------
    # Notifications
    # ------------------------------------------------------------------

    async def _async_notify_stage_change(
        self,
        variety: str,
        stage: str,
        days_elapsed: int,
        harvest_date: date,
    ) -> None:
        """Send a Hungarian notification about the current stage (if enabled)."""
        if not self._notify_enabled:
            return
        last_notified = self.grow_data.get("last_notified_stage")
        dark_days = VARIETIES[variety]["dark_days"]

        if last_notified is None and stage == STAGE_SOTETSIDO:
            title = "Mikrozöld ciklus elindult"
            message = (
                f"Új ciklus elindult! Fajta: {variety}. "
                f"Sötétidő szakasz: {dark_days} nap."
            )
        elif stage == STAGE_NAPOZES:
            title = "Ideje napfényre tenni!"
            message = (
                f"A(z) {variety} napozás szakaszba lépett. "
                f"Várható aratás: {harvest_date.strftime('%Y. %m. %d.')}."
            )
        elif stage == STAGE_ARATAS:
            title = "Aratásra kész!"
            message = f"A(z) {variety} mikrozöld betakarítható."
        else:
            return

        await self._async_send_notification(title, message)

    async def _async_send_notification(self, title: str, message: str) -> None:
        """Call the configured notify service."""
        try:
            await self.hass.services.async_call(
                "notify",
                self._notify_target,
                {"title": title, "message": message},
                blocking=False,
            )
        except Exception:
            _LOGGER.warning(
                "Could not send notification via notify.%s", self._notify_target
            )

    # ------------------------------------------------------------------
    # Service handlers
    # ------------------------------------------------------------------

    async def async_start_grow(self, variety: str, start_date: date) -> None:
        """Persist and activate a new grow cycle."""
        self.grow_data = {
            ATTR_VARIETY: variety,
            ATTR_START_DATE: start_date.isoformat(),
            "last_notified_stage": None,
        }
        await self._store.async_save(self.grow_data)
        _LOGGER.info("Started grow cycle: %s from %s", variety, start_date)
        await self.async_request_refresh()

    async def async_reset(self) -> None:
        """Clear the active grow cycle."""
        self.grow_data = {}
        await self._store.async_save(self.grow_data)
        _LOGGER.info("Grow cycle reset.")
        await self.async_request_refresh()
