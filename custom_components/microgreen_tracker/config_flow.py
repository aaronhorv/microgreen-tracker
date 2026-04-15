"""Config flow for Microgreen Tracker."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlowWithConfigEntry
from homeassistant.core import callback

from .const import CONF_NOTIFY_TARGET, DEFAULT_NOTIFY_TARGET, DOMAIN


def _notify_target_schema(default: str) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_NOTIFY_TARGET, default=default): str,
        }
    )


class MicrogreenTrackerConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle the initial setup of the Microgreen Tracker integration."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the setup form and create the config entry."""
        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        errors: dict[str, str] = {}

        if user_input is not None:
            notify_target = user_input[CONF_NOTIFY_TARGET].strip()
            return self.async_create_entry(
                title="Microgreen Tracker",
                data={CONF_NOTIFY_TARGET: notify_target},
            )

        return self.async_show_form(
            step_id="user",
            data_schema=_notify_target_schema(DEFAULT_NOTIFY_TARGET),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> MicrogreenTrackerOptionsFlow:
        return MicrogreenTrackerOptionsFlow(config_entry)


class MicrogreenTrackerOptionsFlow(OptionsFlowWithConfigEntry):
    """Handle options updates (e.g. changing the notify target)."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the options form."""
        if user_input is not None:
            return self.async_create_entry(
                data={CONF_NOTIFY_TARGET: user_input[CONF_NOTIFY_TARGET].strip()}
            )

        current_target = self.config_entry.options.get(
            CONF_NOTIFY_TARGET,
            self.config_entry.data.get(CONF_NOTIFY_TARGET, DEFAULT_NOTIFY_TARGET),
        )

        return self.async_show_form(
            step_id="init",
            data_schema=_notify_target_schema(current_target),
        )
