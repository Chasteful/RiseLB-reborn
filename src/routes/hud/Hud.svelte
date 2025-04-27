<script lang="ts">
  import ArrayList from "./elements/ArrayList.svelte";
  import TargetHud from "./elements/targethud/TargetHud.svelte";
  import Notifications from "./elements/notifications/Notifications.svelte";
  import TabGui from "./elements/tabgui/TabGui.svelte";
  import HotBar from "./elements/hotbar/HotBar.svelte";
  import Scoreboard from "./elements/Scoreboard.svelte";
  import Watermark from "./elements/Watermark.svelte";
  import Logo from "./elements/Logo.svelte";
  import {onMount} from "svelte";
  import {getComponents, getGameWindow} from "../../integration/rest";
  import {listen} from "../../integration/ws";
  import type {Component} from "../../integration/types";
  import Postion from "./elements/Postion.svelte";
  import type {ComponentsUpdateEvent, ScaleFactorChangeEvent} from "../../integration/events";
  import Keystrokes from "./elements/keystrokes/Keystrokes.svelte";
  import Effects from "./elements/Effects.svelte";
  import BlockCounter from "./elements/BlockCounter.svelte";
  import ArmorItems from "./elements/inventory/ArmorItems.svelte";
  import InventoryContainer from "./elements/inventory/InventoryContainer.svelte";
  import Text from "./elements/Text.svelte";
  import CraftingInput from "./elements/inventory/CraftingInput.svelte";
  import AutoScaler from "../AutoScaler.svelte";
  import Island from "./elements/Island.svelte";
  
    let components: Component[] = [];
    let manualZoom = 1;
    let baseScale = 1;
  
    const baseResolution = { width: 1920, height: 1080 };
  
    function calculateBaseScale() {
      const widthRatio = (window.innerWidth / baseResolution.width) * (window.innerWidth / screen.availWidth);
      const heightRatio = (window.innerHeight / baseResolution.height) * (window.innerHeight / screen.availHeight);
      return Math.min(widthRatio, heightRatio);
    }
  

    onMount(() => {
      const updateScale = () => baseScale = calculateBaseScale();
      window.addEventListener("resize", updateScale);
      updateScale();
  
      getComponents()
        .then(result => {
          components = result.map(c => ({
            ...c,
            settings: (c.settings)
          }));
        })
        .catch(e => console.error("初始化加载失败:", e));
  
      return () => {
        window.removeEventListener("resize", updateScale);
      };
    });
  
    listen("componentsUpdate", (data: ComponentsUpdateEvent) => {
      components = data.components.map(c => ({
        ...c,
        settings: (c.settings)
      }));
    });
    $: hotbarEnabled = components.find(c => c.name === "Hotbar")?.settings.enabled ?? false;
  </script>
  
  <div
    class="hud"
  >
<AutoScaler {manualZoom} baseResolution={{ width: 1920, height: 1080 }}>
  {#each components as c}
    {#if c.settings.enabled}
      <div style="{c.settings.alignment}">
        {#if c.name === "Watermark"}
        <Watermark/>
        {:else if c.name === "Island"}
          <Island/>
        {:else if c.name === "Logo"}
          <Logo/>
        {:else if c.name === "ArrayList"}
          <ArrayList/>
        {:else if c.name === "TabGui"}
          <TabGui/>
        {:else if c.name === "Notifications"}
          <Notifications/>
        {:else if c.name === "TargetHud"}
          <TargetHud/>
        {:else if c.name === "BlockCounter"}
          <BlockCounter/>
        {:else if c.name === "Scoreboard"}
          <Scoreboard/>
        {:else if c.name === "ArmorItems"}
          <ArmorItems/>
        {:else if c.name === "Inventory"}
          <InventoryContainer/>
        {:else if c.name === "CraftingInventory"}
          <CraftingInput/>
        {:else if c.name === "Postion"}
          <Postion/>
        {:else if c.name === "Keystrokes"}
          <Keystrokes/>
        {:else if c.name === "Effects"}
          <Effects/>
        {:else if c.name === "Text"}
          <Text settings={c.settings} />
        {:else if c.name === "Image"}
          <img alt="" src="{c.settings.src}" style="scale: {c.settings.scale};">
        {:else if c.name === "Frame"}
          {#if c.settings.src.startsWith("http")}
            <!-- svelte-ignore a11y_missing_attribute -->
            <!-- svelte-ignore element_invalid_self_closing_tag -->
            <iframe src="{c.settings.src}" style="width: {c.settings.width}px; height: {c.settings.height}px; border: none; scale: {c.settings.scale};" />
          {:else}
            <!-- svelte-ignore a11y_missing_attribute -->
            <!-- svelte-ignore element_invalid_self_closing_tag -->
            <iframe srcdoc="{c.settings.src}" style="width: {c.settings.width}px; height: {c.settings.height}px; border: none; scale: {c.settings.scale};" />
          {/if}
        {:else if c.name === "Html"}
          {@html c.settings.code}
        {/if}
      </div>
    {/if}
  {/each}
</AutoScaler>
  </div>
{#if hotbarEnabled}
  <div style="position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);">
    <HotBar/>
  </div>
{/if}

  <style lang="scss">
    @import "../../colors.scss";
  
    .hud {
      position: fixed;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1080px;
      will-change: transform;
      pointer-events: none;
    }
  </style>
  