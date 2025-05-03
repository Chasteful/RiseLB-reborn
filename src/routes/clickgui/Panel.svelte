<script lang="ts">
  import { onMount, tick } from "svelte";
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import { writable } from 'svelte/store';
  import { setContext } from "svelte";
  import type { Module as TModule } from "../../integration/types";
  import type { ModuleToggleEvent } from "../../integration/events";
  import { listen } from "../../integration/ws";
  import { setItem } from "../../integration/persistent_storage";

  import Module from "./Module.svelte";
  import {
      gridSize,
      highlightModuleName,
      maxPanelZIndex,
      scaleFactor,
      showGrid,
      snappingEnabled,
      filteredModules
  } from "./clickgui_store";
    import { debounce } from "lodash";

  const expandedModuleName = writable<string | null>(null);
  const EDGE_THRESHOLD = 50;
  const UNDO_STACK_LIMIT = 100;
  const ANIMATION_DURATION = 2000;
  setContext("expandedModuleName", expandedModuleName);

  export let modules: TModule[];
  export const locked = writable(false);
  export const showLockHint = writable(false);
  export const saveAnimation = writable<'save' | null>(null);
  export const lockAnimation = writable<'lock' | 'unlock' | null>(null);
  const glowState = writable(false);
  const indicatorOpacity = tweened(0, { duration: 150, easing: cubicOut });

  
  export let category: string;

  export let panelIndex: number;

  
  let panelElement: HTMLElement;
  let modulesElement: HTMLElement;
  let filterMode: 'all' | 'enabled' | 'disabled' = 'all';
  let savedConfig: PanelConfig | null = null;
  let undoStack: PanelConfig[] = [];
  let redoStack: PanelConfig[] = [];
  let lastSaveTime = 0;
  let lastLockToggleTime = 0;
  let moving = false;
  let offsetX = 0;
  let offsetY = 0;
  let scrollPositionSaveTimeout: ReturnType<typeof setTimeout>;
  let ignoreGrid = false;
  let isScrollMode = false;
  let mouseX = 0;
  let hasMoved = false;
  
  interface PanelConfig {
      top: number;
      left: number;
      expanded: boolean;
      scrollTop: number;
      zIndex: number;
  }

  const panelConfig = loadPanelConfig();

  
  $: renderedModules = $filteredModules.length > 0
      ? modules.filter(module => 
          $filteredModules.some(fm => fm.name === module.name)
      )
      : modules.filter(module => {
          if (!panelConfig.expanded) return false;
          if (filterMode === 'enabled') return module.enabled;
          if (filterMode === 'disabled') return !module.enabled;
          return true;
      });

  
  function clamp(number: number, min: number, max: number): number {
      return Math.max(min, Math.min(number, max));
  }

  function clonePanelConfig(config: PanelConfig): PanelConfig {
      return JSON.parse(JSON.stringify(config));
  }

  function snapToGrid(value: number): number {
      return (ignoreGrid || !$snappingEnabled) 
          ? value 
          : Math.round(value / $gridSize) * $gridSize;
  }

  
  function loadPanelConfig(): PanelConfig {
      const localStorageItem = localStorage.getItem(`clickgui.panel.${category}`);

      if (!localStorageItem) {
          return {
              top: panelIndex * 50 + 20,
              left: 20,
              expanded: false,
              scrollTop: 0,
              zIndex: 0
          };
      }

      const config: PanelConfig = JSON.parse(localStorageItem);
      config.zIndex = config.zIndex || 0;

      if (config.zIndex > $maxPanelZIndex) {
          $maxPanelZIndex = config.zIndex;
      }

      if (config.expanded) {
          renderedModules = modules;
      }

      return config;
  }

  async function savePanelConfig() {
      const cloned = clonePanelConfig(panelConfig);
      await setItem(`clickgui.panel.${category}`, JSON.stringify(cloned));
  }

  function fixPosition() {
      panelConfig.left = clamp(
          panelConfig.left,
          0,
          document.documentElement.clientWidth * (2 / $scaleFactor) - panelElement.offsetWidth
      );
      panelConfig.top = clamp(
          panelConfig.top,
          0,
          document.documentElement.clientHeight * (2 / $scaleFactor) - panelElement.offsetHeight
      );
  }

  function applyPanelConfig(config: PanelConfig, saveHistory = false) {
      if (saveHistory) {
          pushUndoState();
      }
      
      Object.assign(panelConfig, {
          ...config,
          zIndex: config.zIndex === 0 ? 0 : ++$maxPanelZIndex
      });
      
      fixPosition();
      savePanelConfig();
      
      tick().then(() => {
          if (modulesElement) {
              modulesElement.scrollTop = panelConfig.scrollTop;
          }
      });
  }

  
  function pushUndoState() {
      undoStack.push(clonePanelConfig(panelConfig));
      if (undoStack.length > UNDO_STACK_LIMIT) {
          undoStack.shift();
      }
      redoStack = [];
  }

  
  function onMouseDown(e: MouseEvent) {
    if ($locked) return;
    
    moving = true;
    hasMoved = false; 
    offsetX = e.clientX * (2 / $scaleFactor) - panelConfig.left;
    offsetY = e.clientY * (2 / $scaleFactor) - panelConfig.top;
    panelConfig.zIndex = ++$maxPanelZIndex;
    panelElement.style.transition = "none";
}
function onMouseMove(e: MouseEvent) {
    if ($locked || !moving) return;

    if (!hasMoved) {
        hasMoved = true;
        if ($snappingEnabled) $showGrid = true;
    }

    panelConfig.left = snapToGrid(e.clientX * (2 / $scaleFactor) - offsetX);
    panelConfig.top = snapToGrid(e.clientY * (2 / $scaleFactor) - offsetY);
    fixPosition();
    debouncedMouseMove(e);
}
export let panelId: string;  
const storageKey = `clickgui.panel.${panelId}.expandedModule`;

  function onMouseUp() {
      if (moving) {
          savePanelConfig();
      }
      moving = false;
      $showGrid = false;
      panelElement.style.transition = "all 0.5s ease";
  }

  function toggleExpanded() {
      if ($filteredModules.length > 0) return;
      
      pushUndoState();
      panelConfig.expanded = !panelConfig.expanded;
      
      setTimeout(() => {
          fixPosition();
          savePanelConfig();
      }, 500);
  }

  function handleModulesScroll() {
      panelConfig.scrollTop = modulesElement.scrollTop;

      clearTimeout(scrollPositionSaveTimeout);
      scrollPositionSaveTimeout = setTimeout(() => {
          savePanelConfig();
          pushUndoState();
      }, 500);
  }

  
  const toggleScrollMode = (enabled: boolean) => {
      isScrollMode = enabled;
      indicatorOpacity.set(enabled ? 1 : 0);
  };

  function handleMouseMove(event: MouseEvent) {
      mouseX = event.clientX;
  }

  function handleMouseDown(event: MouseEvent) {
      if (event.button === 1 && mouseX >= window.innerWidth - EDGE_THRESHOLD) {
          event.preventDefault();
          toggleScrollMode(true);
      }
  }

  function handleMouseUp(event: MouseEvent) {
      if (event.button === 2 && isScrollMode) {
          toggleScrollMode(false);
      }
  }

  function handleWheel(event: WheelEvent) {
      if (!isScrollMode) return;

      if (event.deltaY < 0) {
          console.log('Scroll up → previous category');
      } else if (event.deltaY > 0) {
          console.log('Scroll down → next category');
      }
  }

  
  function handleKeydown(e: KeyboardEvent) {
      if (e.key === "Shift") {
          ignoreGrid = true;
          return;
      }

      if (!e.altKey || e.ctrlKey || e.metaKey) return;

      const key = e.key.toLowerCase();
      if (!['r', 's', 'l', 'd', 'e', 'a', 'z', 'y', 'n'].includes(key)) return;

      e.preventDefault();
      const now = Date.now();

      switch (key) {
          case "l":
              handleLockToggle(now);
              break;
          case "s":
              handleSave(now);
              break;
          case "r":
              handleRestore();
              break;
          case "n":
              handleReset();
              break;
          case "d":
              filterMode = 'disabled';
              break;
          case "e":
              filterMode = 'enabled';
              break;
          case "a":
              filterMode = 'all';
              break;
      }
  }

  function handleLockToggle(now: number) {
      if (now - lastLockToggleTime < ANIMATION_DURATION) return;
      lastLockToggleTime = now;

      locked.update(current => {
          const next = !current;
          lockAnimation.set(next ? 'lock' : 'unlock');
          showLockHint.set(true);

          setTimeout(() => {
              lockAnimation.set(null);
              showLockHint.set(false);
          }, ANIMATION_DURATION);

          return next;
      });
  }

  function handleSave(now: number) {
      if (now - lastSaveTime < ANIMATION_DURATION) return;
      lastSaveTime = now;

      savedConfig = clonePanelConfig(panelConfig);
      saveAnimation.set('save');
      setTimeout(() => saveAnimation.set(null), ANIMATION_DURATION);
      
      glowState.set(true);
      setTimeout(() => glowState.set(false), 1500);
  }

  function handleRestore() {
      if (savedConfig) {
          applyPanelConfig(savedConfig);
      }
  }

  function handleReset() {
      localStorage.removeItem(`clickgui.panel.${category}`);
      const initialConfig = loadPanelConfig();
      applyPanelConfig(initialConfig, true);
  }

  function handleKeyup(e: KeyboardEvent) {
      if (e.key === "Shift") {
          ignoreGrid = false;
      }
  }

  function setupGlobalShortcuts() {
      window.addEventListener("keydown", (e) => {
          if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
              e.preventDefault();
          }
      }, true);
  }

  
  onMount(() => {
      setupGlobalShortcuts();
      fixPosition();
      const last = localStorage.getItem(storageKey);
    if (last) expandedModuleName.set(last);
    // 订阅变化，写入 localStorage
    expandedModuleName.subscribe(name => {
      if (name) localStorage.setItem(storageKey, name);
      else localStorage.removeItem(storageKey);
    });
      const options = { passive: true };
      const keydownHandler = (e: KeyboardEvent) => handleKeydown(e);
      const keyupHandler = (e: KeyboardEvent) => handleKeyup(e);

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', debouncedMouseMove, options);
      window.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener("keydown", keydownHandler, true);
      window.addEventListener("keyup", keyupHandler, true);

      return () => {
          window.removeEventListener("keydown", keydownHandler, true);
          window.removeEventListener("keyup", keyupHandler, true);
          window.removeEventListener('mousemove', debouncedMouseMove);
          window.removeEventListener('mousedown', handleMouseDown);
          window.removeEventListener('mouseup', handleMouseUp);
          window.removeEventListener('wheel', handleWheel);
      };
  });

  
  highlightModuleName.subscribe((name) => {
  if (!name || !modulesElement) return;

  requestAnimationFrame(() => {
    const index = modules.findIndex((m) => m.name === name);
    if (index === -1) return;

    panelConfig.zIndex = ++$maxPanelZIndex;
    panelConfig.expanded = true;
    
   
    setTimeout(() => {
      const targetEl = modulesElement.children[index] as HTMLElement;
      if (targetEl) {
        modulesElement.scrollTo({
          top: targetEl.offsetTop - 20,
          behavior: 'smooth'
        });
      }
    }, 50);
  });
});
const debouncedMouseMove = debounce((e: MouseEvent) => {
  if ($locked || !moving) return;
  
  panelConfig.left = snapToGrid(e.clientX * (2 / $scaleFactor) - offsetX);
  panelConfig.top = snapToGrid(e.clientY * (2 / $scaleFactor) - offsetY);
  fixPosition();
}, 16); // ~60fps


  listen("moduleToggle", (e: ModuleToggleEvent) => {
      const mod = modules.find((m) => m.name === e.moduleName);
      if (!mod) return;

      pushUndoState();
      mod.enabled = e.enabled;
      modules = modules;
      
      if (panelConfig.expanded) {
          renderedModules = modules;
      }
  });

</script>

<!-- Scroll Indicator -->
<div class="scroll-indicator" style="opacity: {$indicatorOpacity}"></div>

<!-- Window Event Listeners -->
<svelte:window 
  on:mouseup={onMouseUp} 
  on:mousemove={onMouseMove} 
  on:keydown={handleKeydown} 
  on:keyup={handleKeyup}
/>

<!-- Panel Wrapper -->
<div 
class="panel-wrapper {moving ? 'no-transition' : ''}" 
bind:this={panelElement}
  class:expanded={panelConfig.expanded}
  style="left: {panelConfig.left}px; top: {panelConfig.top}px; z-index: {panelConfig.zIndex};"
>
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div 
      class="panel"
      class:locked={$locked}
      class:glowing={$glowState}
  >
      <!-- Panel Title -->
      <div 
          class="title" 
          on:mousedown={onMouseDown}
          on:contextmenu|preventDefault={toggleExpanded}
      >
          <img
              class="icon"
              src="img/clickgui/icon-{category.toLowerCase()}.svg"
              alt="icon" 
          />
          <span class="category">{category === 'Client' ? 'Client' : category}</span>

          <!-- Status Indicator -->
          {#if $lockAnimation || $saveAnimation}
              <div class="status-indicator { $locked ? 'locked' : '' }">
                  {#if $lockAnimation}
                      <div class="icon-wrapper 
                          { $lockAnimation === 'lock' ? 'lock-animation' : '' } 
                          { $lockAnimation === 'unlock' ? 'unlock-animation' : '' }"
                      >
                          {#if $locked}
                              <svg viewBox="0 0 24 24">
                                  <path d="M12 3a4 4 0 0 1 4 4v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2v3h4V7a2 2 0 0 0-2-2Z"/>
                              </svg>
                          {:else}
                              <svg viewBox="0 0 24 24">
                                  <path d="M18 8h-1V7a5 5 0 0 0-9.9-1.2l2 1.5A3 3 0 0 1 15 7v1H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Z"/>
                              </svg>
                          {/if}
                      </div>
                  {:else if $saveAnimation}
                      <div class="icon-wrapper save-animation">
                          <svg viewBox="0 0 32 32">
                              <polygon fill="currentColor" points="26 14 24.59 12.59 17 20.17 17 2 15 2 15 20.17 7.41 12.59 6 14 16 24 26 14"/>
                              <path fill="currentColor" d="m26,24v4H6v-4h-2v4h0c0,1.1.9,2,2,2h20c1.1,0,2-.9,2-2h0v-4h-2Z"/>
                          </svg>
                      </div>
                  {/if}
              </div>
          {/if}

          <!-- Expand Toggle Button -->
          <!-- svelte-ignore a11y_consider_explicit_label -->
          <button class="expand-toggle" on:click={toggleExpanded}>
              <div class="icon" class:expanded={panelConfig.expanded || $filteredModules.length > 0}></div>
          </button>
      </div>

      <!-- Modules List -->
      <div 
          class="modules"
          on:scroll={handleModulesScroll}
          bind:this={modulesElement}
          style="--duration: 0.3s"
      >
          {#each renderedModules as {name, enabled, description, aliases} (name)}
              <div>
                  <Module {name} {enabled} {description} {aliases} />
              </div>
          {/each}
      </div>
  </div>
</div>
<style lang="scss">
    @import "../../colors.scss";
    @keyframes flowBorder {
  0%   { background-position: 0% 50%; }
  25%  { background-position: 50% 0%; }
  50%  { background-position: 100% 50%; }
  75%  { background-position: 50% 100%; }
  100% { background-position: 0% 50%; }
}
@keyframes lockEffect {
  0% { opacity: 0; transform: translateY(20px) scale(0.8); }
  40% { opacity: 1; transform: translateY(0) scale(1.1); }
  60% { transform: scale(1); }
  100% { opacity: 0; transform: scale(1.2); }
}

@keyframes unlockEffect {
  0% { opacity: 1; transform: scale(1) rotate(0deg); }
  60% { transform: scale(1.2) rotate(-30deg); }
  100% { opacity: 0; transform: scale(0.5) rotate(45deg); }
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba($accent-color, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba($accent-color, 0); }
  100% { box-shadow: 0 0 0 0 rgba($accent-color, 0); }
}
@keyframes fadeInOut {
  0%   { opacity: 0; }
  20%  { opacity: 1; }
  80%  { opacity: 1; }
  100% { opacity: 0; }
}
    @keyframes gentlePulse {
  0% { opacity: 0; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.02); }
  100% { opacity: 0; transform: scale(0.95); }
}
@keyframes saveEnter {
  0% {
    transform: translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
    
    .save-animation {
      animation: saveEnter 0.5s ease-out;
        
        svg {
            fill: $accent-color;
            width: 24px;
            height: 24px;
            color: $accent-color;
        }
    }
.panel-wrapper {
  position: absolute;
  border-radius: 12px;
  padding: 4px;
  background:transparent;
  box-shadow: 0 0 10px rgba($base, 0.4);
  transition: all 0.5s ease;
  &.no-transition {
    transition: none;
  }
 &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;

    background: linear-gradient(
      135deg,
      rgba($accent-color, 0.5),
      rgba($accent-color-2, 0.5),
      rgba($accent-color, 0.5)
    );
    background-size: 300% 300%;

    pointer-events: none;
    z-index: 0;
    opacity: 1;
  }
}

.scroll-indicator {
    position: fixed;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    width: 4px;
    height: 100px;
    background: white;
    opacity: 0;
    pointer-events: none;
  }
  .panel {
    width: 230px;
    max-width: 100%;
    position: relative;
    overflow: hidden;
    will-change: transform;
    background-color: rgba($base, 0.5);
    border-radius: 8px;
    height: 100%;
    box-sizing: border-box;
    box-shadow: 0 0 8px rgba($accent-color, 0.6);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    

    --glow-color-1: #{$accent-color};
    --glow-color-2: #{lighten($accent-color, 15%)};
    --glow-opacity: 0.5;
}

.panel.glowing {
    isolation: isolate; 
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
    color-mix(in srgb, var(--glow-color-1) 50%, transparent),
    color-mix(in srgb, var(--glow-color-2) 50%, transparent),
    color-mix(in srgb, var(--glow-color-1) 50%, transparent)
);

        background-size: 300% 300%;
        z-index: -1;
        opacity: 0;
        animation: 
            glowGradient 1.5s ease-out,
            glowMovement 3s linear infinite;
    }
}


@keyframes glowGradient {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}

@keyframes glowMovement {
  0% { background-position: 0% 50%; }
  100% { background-position: 100% 50%; }
}
.status-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      position: absolute;
      right: 10px; 
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: $text-color;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.3s ease;
      animation:fadeInOut 2s ease;
  &::before {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: $accent-color;
    transition: opacity 0.3s ease;
    opacity: 0;
  }

  &.locked::before {
    opacity: 1;
    animation: pulse 1.5s infinite;
  }

  .icon-wrapper {
    width: 24px;
    height: 24px;
  }

  .lock-animation {
    animation: lockEffect 2s ease-out;
  }

  .unlock-animation {
    animation: unlockEffect 2s ease-out;
  }

  svg {
    fill: $accent-color;
    width: 24px;
    height: 24px;
  }
}


.panel-wrapper:hover:not(.expanded) {
  box-shadow: 0 0 20px rgba($accent-color, 0.6);
  transform: translateY(-4px);
}

.title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba($accent-color, 0.5);
  cursor: grab;
  text-align: center;
  text-shadow: 0 0 10px rgba($accent-color, 0.3);
  backdrop-filter: blur(2px);  
  border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  position: relative; 
  padding-right: 80px;
  .panel:not(.expanded) & {
    background: rgba($mantle, 0.6);
    box-shadow: inset 0 0 10px rgba($accent-color, 0.2);
    text-shadow: 0 0 5px rgba($accent-color, 0.2);
  }
 .icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}
  .category {
    font-size: 15px;
    color: $text-color;
    font-weight: 600;
    transition: color 0.3s ease;
    
    .panel:not(.expanded) & {
      color: mix($text-color, $accent-color, 80%);
    }
  }
}

.modules {
  max-height: 545px;
  overflow-y: auto;
  overflow-x: hidden;
}

.modules::-webkit-scrollbar {
  width: 0;
}

.expand-toggle {
    background-color: transparent;
    border: none;
    cursor: pointer;

    .icon {
      height: 12px;
      width: 12px;
      position: relative;

      &::before {
        content: "";
        position: absolute;
        background-color: transparent;
        transition: transform 0.4s ease-out;
        top: 0;
        left: 50%;
        width: 2px;
        height: 100%;
        margin-left: -1px;
      }

      &::after {
        content: "";
        position: absolute;
        background-color: transparent;
        transition: transform 0.4s ease-out;
        top: 50%;
        left: 0;
        width: 100%;
        height: 2px;
        margin-top: -1px;
      }
    }
  
}


</style>