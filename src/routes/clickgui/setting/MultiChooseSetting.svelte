<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import type { ModuleSetting, MultiChooseSetting } from "../../../integration/types";
  import { slide } from "svelte/transition";
  import { convertToSpacedString, spaceSeperatedNames } from "../../../theme/theme_config";
  import ExpandArrow from "./common/ExpandArrow.svelte";
  import { setItem } from "../../../integration/persistent_storage";

  export let setting: ModuleSetting;
  export let path: string;

  const cSetting = setting as MultiChooseSetting;
  const thisPath = `${path}.${cSetting.name}`;
  const accentColor1 = "#cdd6f4";    const accentColor2 = "#AD5389";    const dispatch = createEventDispatcher();

  let errorValue: string | null = null;
  let timeoutId: ReturnType<typeof setTimeout>;

  let expanded = localStorage.getItem(thisPath) === "true";
  $: setItem(thisPath, expanded.toString());

  function toggleExpanded() {
      expanded = !expanded;
  }

  function handleChange(v: string) {
      if (cSetting.value.includes(v)) {
          const filtered = cSetting.value.filter(item => item !== v);
          if (filtered.length === 0 && !cSetting.canBeNone) {
              errorValue = v;
              clearTimeout(timeoutId);
              timeoutId = setTimeout(() => (errorValue = null), 300);
              return;
          }
          cSetting.value = filtered;
      } else {
          cSetting.value = [...cSetting.value, v];
      }

      setting = { ...cSetting };
      dispatch("change");
  }

     $: borderWidth = 2 + (cSetting.value.length / cSetting.choices.length) * 2;
  $: glowIntensity = Math.pow(cSetting.value.length / cSetting.choices.length, 1.8) * 0.6;
  $: borderProgress = cSetting.choices.length === 0
      ? 0
      : cSetting.value.length / cSetting.choices.length;



     function mixColors(a: string, b: string, amount: number, alpha: number): string {
         const hexToRGB = (hex: string): [number, number, number] => {
        const bigint = parseInt(hex.slice(1), 16);
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    };

         const rgbToHex = (r: number, g: number, b: number, a: number): string => {
        const alphaHex = Math.round(a * 255).toString(16).padStart(2, "0");
        return `#${(1 << 24 | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}${alphaHex}`;
    };

         const aRGB = hexToRGB(a);
    const bRGB = hexToRGB(b);
    const mixedRGB = aRGB.map((c, i) => Math.round(c + (bRGB[i] - c) * amount)) as [number, number, number];

    return rgbToHex(mixedRGB[0], mixedRGB[1], mixedRGB[2], alpha);
  }

     $: mixedBorderColor = mixColors(accentColor1, accentColor2, borderProgress, 0.1 + 0.9 * borderProgress);

</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div 
  class="setting"
  class:has-selections={cSetting.value.length > 0}
  style="
      --selection-count: {cSetting.value.length};
      --total-choices: {cSetting.choices.length};
      --border-width: {borderWidth}px;
      --glow-intensity: {glowIntensity};
      --border-color: {mixedBorderColor};
  "
>
  <div class="head" class:expanded on:contextmenu|preventDefault={toggleExpanded}>
      <div class="title">{$spaceSeperatedNames ? convertToSpacedString(cSetting.name) : cSetting.name}</div>
      <div class="amount">{cSetting.value.length}/{cSetting.choices.length}</div>
      <ExpandArrow bind:expanded />
  </div>

  {#if expanded}
      <div class="choices" transition:slide|global={{duration: 200, axis: "y"}}>
          {#each cSetting.choices as choice}
              <div
                  class="choice"
                  class:active={cSetting.value.includes(choice)}
                  class:error={errorValue === choice}
                  on:click={() => handleChange(choice)}
              >
                  {$spaceSeperatedNames ? convertToSpacedString(choice) : choice}
              </div>
          {/each}
      </div>
  {/if}
</div>

<style lang="scss">
@use "../../../colors.scss" as *;

.setting {
  position: relative;
  padding: 12px;
  border-radius: 8px;
  will-change: transform, opacity;
  background: rgba($mantle, 0.4);
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  box-sizing: border-box;
  overflow: hidden;
  --border-opacity: 0.1;

  &:hover {
    --border-opacity: 0.2;
  }

  &.has-selections {
    --border-opacity: 0.5;

    &:hover {
      --border-opacity: 0.6;      }
  }

  &::before {
    opacity: var(--border-opacity);
  background: linear-gradient(
    135deg,
    $accent-color,
    $accent-color
  );
  transition: opacity 0.4s ease;
    box-shadow:
      0 0 calc(10px * var(--glow-intensity)) rgba($accent-color, var(--border-opacity)),
      inset 0 0 calc(10px * var(--glow-intensity)) rgba($accent-color, var(--border-opacity));
  }

  &::before {
      content: '';
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 10px;
      background: linear-gradient(
          135deg,
          var(--border-color),
          rgba($accent-mix, 0.4)
      );
      z-index: 0;
      padding: 4px;
      -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
      pointer-events: none;
      transition: all 0.4s ease;
  }

  &.has-selections {
      --glow-size: calc(10px * var(--glow-intensity));
      box-shadow:
          0 0 var(--glow-size) var(--border-color),
          inset 0 0 var(--glow-size) var(--border-color);
  }
}

.title {
  color: $text;
  font-size: 12px;
  font-weight: 600;
}

.choice {
  color: $subtext0;
  background-color: rgba($base, 0.3);
  border-radius: 3px;
  padding: 3px 6px;
  cursor: pointer;
  font-weight: 500;
  transition: ease 0.2s;
  overflow-wrap: anywhere;

  &:hover {
      color: $text;
  }

  &.error {
      background-color: rgba($menu-error-color, 0.1) !important;
      color: $menu-error-color !important;
      box-shadow: 0 0 8px 2px rgba($menu-error-color, 0.1);
  }

  &.active {
      background-color: rgba($accent, 0.1);
      color: $accent-color;
      box-shadow: 0 0 8px 2px rgba($accent, 0.1);
  }
}

.amount {
  letter-spacing: 1px;
  font-weight: 500;
  font-size: 12px;
  color: $text;
}

.head {
  display: grid;
  grid-template-columns: 1fr max-content max-content;
  transition: ease margin-bottom .2s;

  &.expanded {
      margin-bottom: 10px;
  }
}

.choices {
  padding: 4px 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  font-size: 12px;
}
</style>
