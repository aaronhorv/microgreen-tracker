"""Config flow for Microgreen Tracker."""

from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.helpers.selector import (
    BooleanSelector,
    TextSelector,
)

from homeassistant.config_entries import (
    ConfigEntry,
    ConfigFlow,
    ConfigFlowResult,
    OptionsFlowWithConfigEntry,
)
from homeassistant.core import callback

from .const import (
    CONF_NOTIFY_ENABLED,
    CONF_NOTIFY_TARGET,
    DEFAULT_NOTIFY_TARGET,
    DOMAIN,
)


def _build_schema(notify_enabled: bool, notify_target: str) -> vol.Schema:
    return vol.Schema(
        {
            vol.Required(CONF_NOTIFY_ENABLED, default=notify_enabled): BooleanSelector(),
            vol.Optional(CONF_NOTIFY_TARGET, default=notify_target): TextSelector(),
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

        if user_input is not None:
            return self.async_create_entry(
                title="Microgreen Tracker",
                data={
                    CONF_NOTIFY_ENABLED: user_input[CONF_NOTIFY_ENABLED],
                    CONF_NOTIFY_TARGET: user_input.get(
                        CONF_NOTIFY_TARGET, DEFAULT_NOTIFY_TARGET
                    ).strip(),
                },
            )

        return self.async_show_form(
            step_id="user",
            data_schema=_build_schema(True, DEFAULT_NOTIFY_TARGET),
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: ConfigEntry,
    ) -> MicrogreenTrackerOptionsFlow:
        return MicrogreenTrackerOptionsFlow(config_entry)


class MicrogreenTrackerOptionsFlow(OptionsFlowWithConfigEntry):
    """Handle options updates (notify toggle + target)."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Show the options form."""
        if user_input is not None:
            return self.async_create_entry(
                data={
                    CONF_NOTIFY_ENABLED: user_input[CONF_NOTIFY_ENABLED],
                    CONF_NOTIFY_TARGET: user_input.get(
                        CONF_NOTIFY_TARGET, DEFAULT_NOTIFY_TARGET
                    ).strip(),
                }
            )

        def _get(key, default):
            return self.config_entry.options.get(
                key, self.config_entry.data.get(key, default)
            )

        return self.async_show_form(
            step_id="init",
            data_schema=_build_schema(
                _get(CONF_NOTIFY_ENABLED, True),
                _get(CONF_NOTIFY_TARGET, DEFAULT_NOTIFY_TARGET),
            ),
        )
