/*
 * This file is part of LiquidBounce (https://github.com/CCBlueX/LiquidBounce)
 *
 * Copyright (c) 2015 - 2025 CCBlueX
 *
 * LiquidBounce is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * LiquidBounce is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LiquidBounce. If not, see <https://www.gnu.org/licenses/>.
 *
 *
 */

package net.ccbluex.liquidbounce.integration.theme.component

import net.ccbluex.liquidbounce.config.types.NamedChoice

/**
 * A set of tweaks that can be applied to the Original HUD by the component
 */
object FeatureTweakManager {
    private val disabledTweaks = mutableSetOf<FeatureTweak>()

    fun isDisabled(tweak: FeatureTweak): Boolean {
        return tweak in disabledTweaks
    }

    fun setDisabled(tweak: FeatureTweak, disabled: Boolean) {
        if (disabled) {
            disabledTweaks.add(tweak)
        } else {
            disabledTweaks.remove(tweak)
        }
    }
}
enum class FeatureTweak(override val choiceName: String) : NamedChoice {

    TWEAK_HOTBAR("tweakHotbar"),
    DISABLE_ITEM_ICONS("disableItemIcons"),
    DISABLE_CROSSHAIR("disableCrosshair"),
    DISABLE_SCOREBOARD("disableScoreboard"),
    DISABLE_STATUS_BAR("disableStatusBar"),
    DISABLE_EXP_BAR("disableExpBar"),
    DISABLE_HELD_ITEM_TOOL_TIP("disableHeldItemToolTip"),
    DISABLE_OVERLAY_MESSAGE("disableOverlayMessage"),
    DISABLE_STATUS_EFFECT_OVERLAY("disableStatusEffectOverlay");

    fun isDisabled(): Boolean {
        return FeatureTweakManager.isDisabled(this)
    }
}
