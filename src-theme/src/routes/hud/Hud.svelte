<script lang="ts">
  import { onMount } from "svelte";
  import ArrayList from "./elements/ArrayList.svelte";
  import TargetHud from "./elements/targethud/TargetHud.svelte";
  import Notifications from "./elements/notifications/Notifications.svelte";
  import TabGui from "./elements/tabgui/TabGui.svelte";
  import HealthBar from "./elements/hotbar/HealthBar.svelte";
  import Scoreboard from "./elements/Scoreboard.svelte";
  import Watermark from "./elements/Watermark.svelte";
  import Logo from "./elements/Logo.svelte";
  import Position from "./elements/Position.svelte";
  import ItemColumn from "./elements/hotbar/ItemColumn.svelte"
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
  import StatusBar from "./elements/hotbar/StatusBar.svelte";
  import Message from "./elements/hotbar/Message.svelte";
  import SplashScreen from '../menu/splash/SplashScreen.svelte';
  const baseResolution = { width: 1920, height: 1080 };
  let splashDone = false;
  let hudZoom = 100;
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

  });
  listen("componentsUpdate", (e: ComponentsUpdateEvent) => {
    components = [];2
    components = e.components;
  });

</script>
{#if !splashDone}
  <SplashScreen on:finish={() => splashDone = true} />
{:else}
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
          {:else if c.name === "HealthBar"}    <HealthBar/>
          {:else if c.name === "BlockCounter"}<BlockCounter/>
          {:else if c.name === "Scoreboard"}  <Scoreboard/>
          {:else if c.name === "ArmorItems"}  <ArmorItems/>
          {:else if c.name === "Inventory"}   <InventoryContainer/>
          {:else if c.name === "CraftingInventory"}<CraftingInput/>
          {:else if c.name === "Position"}    <Position/>
          {:else if c.name === "Keystrokes"}  <Keystrokes/>
          {:else if c.name === "Effects"}     <Effects/>
          {:else if c.name === "Message"}     <Message/>
          {:else if c.name === "Status"}        <StatusBar/>
          {:else if c.name === "ItemColumn"}  <ItemColumn/>
          {:else if c.name === "Text"}        <Text settings={c.settings}/>
          {:else if c.name === "Image"}       <img alt="" src="{c.settings.src}" style="scale: {c.settings.scale};"/>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
</div>
{/if}

<style lang="scss">
  @import "../../colors.scss";
  .hud {
    height: 100vh;
    width: 100vw;
  }
</style>

