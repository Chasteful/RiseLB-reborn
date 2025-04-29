<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { Module } from "../../../integration/types";
  import { getModules } from "../../../integration/rest";
  import { listen } from "../../../integration/ws";
  import { getTextWidth } from "../../../integration/text_measurement";
  import { flip } from "svelte/animate";
  import { fly } from "svelte/transition";
  import { convertToSpacedString, spaceSeperatedNames } from "../../../theme/theme_config";
  import { getPrefixAsync } from "../../../theme/arraylist";
  import { expoInOut } from "svelte/easing";
  import TextComponent from "../../menu/common/TextComponent.svelte";
  import type { PlayerData, Scoreboard } from "../../../integration/types";
  import type {ClientPlayerDataEvent} from "../../../integration/events";

  let enabledModules: (Module & { prefix: string; formattedName: string; width: number })[] = [];
  let scoreboard: Scoreboard | null = null;
  async function updateEnabledModules() {
      await document.fonts.load("500 16px 'Inter'");
      const modules = await getModules();
      const visibleModules = modules.filter(m => m.enabled && !m.hidden);
      const prefixMap = new Map<string, string>();
      await Promise.all(visibleModules.map(async module => {
          const prefix = await getPrefixAsync(module.name);
          prefixMap.set(module.name, prefix);
      }));
      const modulesWithWidths = visibleModules.map(module => {
          const formattedName = $spaceSeperatedNames ? convertToSpacedString(module.name) : module.name;
          const prefix = prefixMap.get(module.name) || "";
          const fullName = `${formattedName} ${prefix}`;
          const font = "500 16px 'Inter', system-ui, sans-serif";
          const width = getTextWidth(fullName, font);
          return {
              ...module,
              formattedName,
              prefix,
              width
          };
      });
      modulesWithWidths.sort((a, b) => b.width - a.width);
      enabledModules = modulesWithWidths;
      await tick();
  }
  spaceSeperatedNames.subscribe(async () => {
      await updateEnabledModules();
  });
  onMount(async () => {
      await updateEnabledModules();
      setTimeout(() => updateEnabledModules(), 50);
  });
  listen("moduleToggle", async () => {
      await updateEnabledModules();
  });
  listen("refreshArrayList", async () => {
      await updateEnabledModules();
  });
  listen("clientPlayerData", (e: ClientPlayerDataEvent) => {
      const playerData: PlayerData = e.playerData;
      scoreboard = playerData.scoreboard;
  });

</script>
<div class="combined-container">
  {#if enabledModules.length > 0}
      <div class="arraylist-section"id="arraylist"transition:fly|global={{duration: 500, y: -50, easing: expoInOut}}>
          {#each enabledModules as { formattedName, prefix, name } (name)}
              <div class="module" id="module-name" animate:flip={{ duration: 200 }} in:fly={{ x: 50, duration: 200 }}>
                {formattedName}{#if prefix}&nbsp;<span class="prefix">{prefix}</span>{/if}
                  <span class="side-bar" id="side-bar"></span>
              </div>
          {/each}
      </div>
  {/if}
  {#if scoreboard}
      <div class="scoreboard-section"transition:fly|global={{duration: 500, x: 50, easing: expoInOut}}>
          {#if scoreboard.header}
              <div class="header">
                  <TextComponent fontSize={16} allowPreformatting={true} textComponent={scoreboard.header}/>
              </div>
          {/if}
          <div class="entries">
              {#each scoreboard.entries as {name, score}}
                  <div class="row">
                      <TextComponent fontSize={14} allowPreformatting={true} textComponent={name}/>
                  </div>
              {/each}
          </div>
      </div>
  {/if}
</div>

<style lang="scss">
  @import "../../../colors.scss";
  :root {
      --accent-color: #{$accent-color};
      --accent-color-2: #{$accent-color-2};
  }
  .combined-container {
  position: fixed;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px; 
  transform: translateZ(0);
  will-change: transform;
}
  .arraylist-section {
      border-radius: 0;
      overflow: visible; 
      margin-bottom: 5px;
      margin-left: auto;
  }
  .module {
      position: relative;
      display: flex;
      align-items: center;
      padding-right: 24px;
      background-color: rgba(0, 0, 0, 0.2);
      color: var(--accent-color);
      text-shadow: var(--accent-color);
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      font-size: 16px;
      padding: 2px 6px;
      width: max-content;
      font-weight: 500;
      margin-left: auto;
      text-transform: capitalize;
      border-radius: 0;
      position: relative;
      &::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          z-index: -1;
      }
  }
  .prefix {
      color: #AAAAAA;
      text-shadow: 0 0 3px rgba(#AAAAAA,0.9);
  }
  .side-bar {
      position: absolute;
      right: -3px;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: calc(100% - 6px);
      background-color: currentColor;
      border-radius: 2px;
      box-shadow: 0 0 5px currentColor;
      pointer-events: none;
  }
  .scoreboard-section {
    position: relative;
    overflow: hidden;
    font-size: 14px;
    box-shadow: 0px 0px 4px 4px rgba(0,0,0,0.5);
    border-radius: 0;
    display: inline-block; 
    right: 0;
    transition: width 0.2s ease;
    transform: translateX(0);
    margin-left: auto;
}
.entries {
    background-color: rgba($scoreboard-base-color, 0.5);
    padding: 10px;
}
.row {
    display: flex;
    column-gap: 15px;
    gap: 2px;
    justify-content: space-between;
    white-space: nowrap; 
}
.header {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba($scoreboard-base-color, 0.5);
    padding: 10px;
    color: $accent-color;
    text-shadow: $base 0px 0px 16px;
    font-size: 20px;
    text-align: center;
    white-space: nowrap; 
    box-sizing: border-box;
}
</style>