<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { writable } from "svelte/store";
  import { getGameWindow, getModules, getModuleSettings, openScreen } from "../../integration/rest";
  import { groupByCategory } from "../../integration/util";
  import Panel from "./Panel.svelte";
  import Description from "./Description.svelte";
  import { fade } from "svelte/transition";
  import { listen } from "../../integration/ws";
  import { cubicOut } from "svelte/easing";
  import Search from './Search.svelte';
  import { derived } from 'svelte/store';
  import { getComponents } from "../../integration/rest";
  let components: Component[] = [];
  import {
    resolutionScale,
    viewportOffset,
    scaleFactor,
    showResults,
    isClickGuiOpen, 
  } from "./clickgui_store";
  import {
    gridSize,
    showGrid,
    snappingEnabled
  } from "./clickgui_store";

  import type {
    ClickGuiValueChangeEvent,
    ScaleFactorChangeEvent
  } from "../../integration/events";
  import type {
    Component,
    ConfigurableSetting,
    GroupedModules,
    Module,
    TogglableSetting
  } from "../../integration/types";

  let showOverlay = false;
  let categories: GroupedModules = {};
  let modules: Module[] = [];

  let showSearch = writable(false);
  let hoverSearchTip = writable(false);
  let isHoveringTip = false;
  let tipCooldown = false;
  let tipCooldownTimeout: ReturnType<typeof setTimeout> | null = null;

  let minecraftScaleFactor = 2;
  let clickGuiScaleFactor = 1;

  $: {
    const scale = $resolutionScale * clickGuiScaleFactor * minecraftScaleFactor;
    scaleFactor.set(scale);
  }

  const calculateBaseScale = () => {
    const baseHeight = 1080;
    const heightRatio = window.innerHeight / baseHeight;
    return heightRatio;
  };
  const overlayVisible = derived(showResults, ($s) => {
    showOverlay = $s;
    return $s;
  });
  const updateViewport = () => {
    const baseWidth = 1920;
    const baseHeight = 1080;
    const scale = calculateBaseScale();

    resolutionScale.set(scale);
    const offsetX = (window.innerWidth - baseWidth * scale) / 2;
    const offsetY = (window.innerHeight - baseHeight * scale) / 2;
    viewportOffset.set({ x: offsetX, y: offsetY });

    const wrapper = document.querySelector(".viewport-wrapper") as HTMLElement;
    if (wrapper) {
      wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    }
  };

  const applyValues = (configurable: ConfigurableSetting) => {
    clickGuiScaleFactor = configurable.value.find(v => v.name === "Scale")?.value as number ?? 1;
    const snappingValue = configurable.value.find(v => v.name === "Snapping") as TogglableSetting;
    $snappingEnabled = snappingValue?.value.find(v => v.name === "Enabled")?.value as boolean ?? true;
    $gridSize = snappingValue?.value.find(v => v.name === "GridSize")?.value as number ?? 10;

    updateViewport();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();

      showSearch.update(current => {
        const next = !current;
        if (!next) {
          isHoveringTip = false;
          hoverSearchTip.set(false);
          tipCooldown = true;
          if (tipCooldownTimeout) clearTimeout(tipCooldownTimeout);
          tipCooldownTimeout = setTimeout(() => {
            tipCooldown = false;
            hoverSearchTip.set(true);
          }, 500);
        }
        return next;
      });
    }
  };


  onMount(async () => {
  const gameWindow = await getGameWindow();
  minecraftScaleFactor = gameWindow.scaleFactor;

  updateViewport();
  modules = await getModules();
  categories = groupByCategory(modules);

  const clickGuiSettings = await getModuleSettings("ClickGUI");
  applyValues(clickGuiSettings);


  components = await getComponents();

  window.addEventListener("resize", updateViewport);
  window.addEventListener("keydown", handleKeydown);
});


  onDestroy(() => {
    window.removeEventListener("resize", updateViewport);
    window.removeEventListener("keydown", handleKeydown);
  });

  listen("scaleFactorChange", async (e: ScaleFactorChangeEvent) => {
    minecraftScaleFactor = e.scaleFactor;
    updateViewport();
  });

  listen("clickGuiValueChange", (e: ClickGuiValueChangeEvent) => {
    applyValues(e.configurable);
  });


  $: showTip = !$showSearch && isHoveringTip && !tipCooldown;
</script>

<div class={`clickgui ${$showGrid ? 'grid' : ''}`}
     style="transform: scale({clickGuiScaleFactor * $resolutionScale}); transform-origin: top left; background-size: {$gridSize}px {$gridSize}px; position: relative; width: 1920px; height: 1080px;">
     {#if $overlayVisible}
     <!-- svelte-ignore element_invalid_self_closing_tag -->
     <div class="elegant-overlay" />
   {/if}
  <!-- 提示文字 -->
  {#if !$showSearch}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="ctrl-f-tip"
         class:visible={showTip}
         on:mouseenter={() => isHoveringTip = true}
         on:mouseleave={() => isHoveringTip = false}
         on:click={() => $showSearch = true}>
      Press CTRL+F to open search bar
    </div>
  {/if}

  <!-- 搜索框 -->
  {#if $showSearch}
    <div transition:fade={{ duration: 300, easing: cubicOut }}>
      <Search modules={structuredClone(modules)} />
    </div>
  {/if}

  <!-- 其他内容 -->
  {#each Object.entries(categories) as [category, modules], panelIndex}
    <Panel {category} {modules} {panelIndex} />
  {/each}
</div>

  <!-- 搜索框 -->
  {#if $showSearch}
    <div transition:fade={{ duration: 300, easing: cubicOut }}>
      <Search modules={structuredClone(modules)} />
    </div>
  {/if}
<Description />

<style lang="scss">
  @use "../../colors.scss" as *;

  $GRID_SIZE: 10px;

  .clickgui {
    overflow: hidden;
    position: fixed;
    will-change: opacity;
    top: 0;
    left: 0;
    width: 100vw; 
    height: 100vh;
    transform-origin: top left;
  
    &.grid {
      background-image: linear-gradient(to right, $clickgui-grid-color 1px, transparent 1px),
      linear-gradient(to bottom, $clickgui-grid-color 1px, transparent 1px);
    }
  }
.elegant-overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  pointer-events: auto; // 允许点击交互
  
  // 渐变光晕效果
  background: radial-gradient(
    ellipse at center,
    rgba(0, 0, 0, 0) 0%,
    rgba(0, 0, 0, 0.5) 100%
  );
  
  // 边缘光效
  box-shadow: inset 0 0 60px 20px rgba(255, 255, 255, 0.03);
  
  // 高级模糊效果
  backdrop-filter: blur(12px) brightness(0.95);
  -webkit-backdrop-filter: blur(12px) brightness(0.95);
  
  // 微妙的纹理
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: 
      url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E"),
      linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.02) 100%);
  }
  
  // 优雅的入场动画
  opacity: 0;
  animation: elegant-appear 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  // 边缘高光
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }
}

@keyframes elegant-appear {
  0% {
    opacity: 0;
    transform: scale(1.02);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}


.hud-edit-button {
  position: absolute;
  top: 30px;
  right: 30px;
  padding: 6px 14px;
  background: rgba($accent-color, 0.2);
  color: $accent-color;
  font-weight: bold;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;

  &:hover {
    background: rgba($accent-color, 0.3);
    transform: scale(1.05);
  }
}
  .ctrl-f-tip {
  position: absolute;
  bottom: 150px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 32px;
  color: rgba($text, 0.3);
  text-shadow: 0 0 16px rgba($text,0.5);
  font-weight: bold;
  padding: 8px 16px;
  border-radius: 20px;
  background: rgba($base, 0);
  backdrop-filter: blur(5px);
  cursor: pointer;
  transition: all 0.3s ease;
  pointer-events: auto;


  &.visible {
    &:hover {
      color: rgba($text, 0.5);
      transform: translateX(-50%) scale(1.05);
      text-shadow:
      4 8 12px rgba($base,0.52),
      4 8 16px rgba($text,0.8);
    }
  }
}
</style>
