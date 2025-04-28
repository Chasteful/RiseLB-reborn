<script lang="ts">
  import { onMount } from "svelte";
  import ArrayList from "./elements/ArrayList.svelte";
  import TargetHud from "./elements/targethud/TargetHud.svelte";
  import Notifications from "./elements/notifications/Notifications.svelte";
  import TabGui from "./elements/tabgui/TabGui.svelte";
  import HotBar from "./elements/hotbar/HotBar.svelte";
  import Scoreboard from "./elements/Scoreboard.svelte";
  import Watermark from "./elements/Watermark.svelte";
  import Logo from "./elements/Logo.svelte";
  import Position from "./elements/Position.svelte";
  import Keystrokes from "./elements/keystrokes/Keystrokes.svelte";
  import Effects from "./elements/Effects.svelte";
  import BlockCounter from "./elements/BlockCounter.svelte";
  import ArmorItems from "./elements/inventory/ArmorItems.svelte";
  import InventoryContainer from "./elements/inventory/InventoryContainer.svelte";
  import CraftingInput from "./elements/inventory/CraftingInput.svelte";
  import Text from "./elements/Text.svelte";
  import Island from "./elements/Island.svelte";

  import { getComponents, getGameWindow } from "../../integration/rest";
  import { listen } from "../../integration/ws";
  import type { Component } from "../../integration/types";
  import type { ComponentsUpdateEvent, ScaleFactorChangeEvent } from "../../integration/events";

  const baseResolution = { width: 1920, height: 1080 };

  let hudZoom = 100;     
  let hotbarZoom = 100;   
  let components: Component[] = [];
  const MIN_COEFF = 0.1337;
  function calcAdjustedResolution() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = 16 / 9;
    if (w / h > aspect) {
      return { width: h * aspect, height: h };
    } else {
      return { width: w, height: w / aspect };
    }
  }

  function calcResolutionCoefficient(): number {
    const { width, height } = calcAdjustedResolution();
    const wRatio = width / baseResolution.width;
    const hRatio = height / baseResolution.height;
    return Math.min(1, Math.max(MIN_COEFF, Math.min(wRatio, hRatio)));
  }

  async function updateZoom(): Promise<void> {
    const gameWindow = await getGameWindow();
    const gameScale = gameWindow.scaleFactor * 50;
 
    hudZoom = gameScale * calcResolutionCoefficient();

    hotbarZoom = gameScale;
  }

  onMount(() => {
    updateZoom();
    getComponents().then(data => (components = data));
    window.addEventListener("resize", updateZoom);
    return () => window.removeEventListener("resize", updateZoom);
  });

  listen("scaleFactorChange", (e: ScaleFactorChangeEvent) => {
    const gameScale = e.scaleFactor * 50;
    hudZoom = gameScale * calcResolutionCoefficient();
    hotbarZoom = gameScale;
  });

  listen("componentsUpdate", (e: ComponentsUpdateEvent) => {
    components = [];
    components = e.components;
  });

  $: hotbarEnabled = components.find(c => c.name === "Hotbar")?.settings.enabled ?? false;
</script>

<div class="hud" style="zoom: {hudZoom}%">
  <div class="hud">
    {#each components as c (c.name)}
      {#if c.settings.enabled}
        <div style="{c.settings.alignment}">
          {#if c.name === "Watermark"}        <Watermark/>
          {:else if c.name === "Island"}      <Island/>
          {:else if c.name === "Logo"}        <Logo/>
          {:else if c.name === "ArrayList"}   <ArrayList/>
          {:else if c.name === "TabGui"}      <TabGui/>
          {:else if c.name === "Notifications"}<Notifications/>
          {:else if c.name === "TargetHud"}   <TargetHud/>
          {:else if c.name === "BlockCounter"}<BlockCounter/>
          {:else if c.name === "Scoreboard"}  <Scoreboard/>
          {:else if c.name === "ArmorItems"}  <ArmorItems/>
          {:else if c.name === "Inventory"}   <InventoryContainer/>
          {:else if c.name === "CraftingInventory"}<CraftingInput/>
          {:else if c.name === "Position"}    <Position/>
          {:else if c.name === "Keystrokes"}  <Keystrokes/>
          {:else if c.name === "Effects"}     <Effects/>
          {:else if c.name === "Text"}        <Text settings={c.settings}/>
          {:else if c.name === "Image"}       <img alt="" src="{c.settings.src}" style="scale: {c.settings.scale};"/>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>

{#if hotbarEnabled}
  <div
    class="hotbar-wrapper"
    style="transform: translateX(-50%) scale({hotbarZoom / 100}); transform-origin: center bottom;"
  >
    <HotBar/>
  </div>
{/if}

<style lang="scss">
  @import "../../colors.scss";

  .hud {
    height: 100vh;
    width: 100vw;
  }.hotbar-wrapper {
  position: fixed;
  left: 50%;
  bottom: 20px;

  pointer-events: none;
}
</style>
