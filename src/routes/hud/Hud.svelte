<script lang="ts">
    import ArrayList from "./elements/ArrayList.svelte";
    import TargetHud from "./elements/targethud/TargetHud.svelte";
    import Watermark from "./elements/Watermark.svelte";
    import Notifications from "./elements/notifications/Notifications.svelte";
    import TabGui from "./elements/tabgui/TabGui.svelte";
    import HotBar from "./elements/hotbar/HotBar.svelte";
    import Scoreboard from "./elements/Scoreboard.svelte";
    import Taco from "./elements/taco/Taco.svelte";
    import Keystrokes from "./elements/keystrokes/Keystrokes.svelte";
    import Effects from "./elements/Effects.svelte";
    import BlockCounter from "./elements/BlockCounter.svelte";
    import PointerESP from "./elements/pointeresp/PointerESP.svelte";
    import Text from "./elements/Text.svelte";
  
    import { onMount } from "svelte";
    import { getComponents } from "../../integration/rest";
    import { listen } from "../../integration/ws";
    import { isEditingHud } from "../../integration/hudEdit";
    import type { Component, HUDComponentSettings } from "../../integration/types";
    import type { ComponentsUpdateEvent } from "../../integration/events";
  
    let components: Component[] = [];
    let manualZoom = 1;
    let baseScale = 1;
  
    const baseResolution = { width: 1920, height: 1080 };
  
    function calculateBaseScale() {
      const widthRatio = (window.innerWidth / baseResolution.width) * (window.innerWidth / screen.availWidth);
      const heightRatio = (window.innerHeight / baseResolution.height) * (window.innerHeight / screen.availHeight);
      return Math.min(widthRatio, heightRatio);
    }
  
    function normalizeSettings(settings: any): HUDComponentSettings {
      return {
        enabled: true,
        alignment: "",
        scale: 1,
        ...settings
      };
    }
  
    onMount(() => {
      const updateScale = () => baseScale = calculateBaseScale();
      window.addEventListener("resize", updateScale);
      updateScale();
  
      getComponents()
        .then(result => {
          components = result.map(c => ({
            ...c,
            settings: normalizeSettings(c.settings)
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
        settings: normalizeSettings(c.settings)
      }));
    });
  </script>
  
  <div
    class="hud"
    class:editing-mode={$isEditingHud}
    style="transform: scale({baseScale * manualZoom}); transform-origin: 0 0;"
  >
    {#each components as c}
      {#if c.settings.enabled}
        <div style={c.settings.alignment}>
          {#if c.name === "Watermark"}
            <Watermark editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "ArrayList"}
            <ArrayList editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "TabGui"}
            <TabGui editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Notifications"}
            <Notifications editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "TargetHud"}
            <TargetHud editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "BlockCounter"}
            <BlockCounter editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "PointerESP"}
            <PointerESP editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "HotBar"}
            <HotBar editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Scoreboard"}
            <Scoreboard editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Taco"}
            <Taco editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Keystrokes"}
            <Keystrokes editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Effects"}
            <Effects editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Text"}
            <Text editing={$isEditingHud} settings={c.settings} />
          {:else if c.name === "Image"}
            <img alt="" src={c.settings.src} style="scale: {c.settings.scale};" />
          {/if}
        </div>
      {/if}
    {/each}
  </div>
  
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
  
      > * {
        pointer-events: auto;
      }
  
      &.editing-mode {
        filter: brightness(0.7);
        pointer-events: none;
  
        > * {
          pointer-events: none;
        }
      }
    }
  </style>
  