<script lang="ts">
    import {onMount, tick} from "svelte";
    import type {Module as TModule} from "../../integration/types";
    import {listen} from "../../integration/ws";
    import Module from "./Module.svelte";
    import type {ModuleToggleEvent} from "../../integration/events";
    import {fly} from "svelte/transition";
    import {expoInOut} from "svelte/easing";
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    import {
        gridSize,
        highlightModuleName,
        maxPanelZIndex,
        scaleFactor,
        showGrid,
        snappingEnabled
    } from "./clickgui_store";
    import {setItem} from "../../integration/persistent_storage";
    import { filteredModules } from './clickgui_store';
    import { writable } from 'svelte/store';
    export const locked = writable(false);
    export const showLockHint = writable(false);
    export let category: string;
    export let modules: TModule[];
    export let panelIndex: number;
    export const lockAnimation = writable<'lock' | 'unlock' | null>(null);
    let lastSaveTime = 0;
    let lastLockToggleTime = 0;
    let panelElement: HTMLElement;
    let modulesElement: HTMLElement;
    const glowState = writable(false);
    let filterMode: 'all' | 'enabled' | 'disabled' = 'all';
    let savedConfig: PanelConfig | null = null;
    let undoStack: PanelConfig[] = [];
    let redoStack: PanelConfig[] = [];
    locked.subscribe(v => $locked = v);
    lockAnimation.subscribe(v => $lockAnimation = v);
    export function setupGlobalShortcuts() {
        window.addEventListener("keydown", (e) => {
            if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
                e.preventDefault();
                console.log("全局阻止 Ctrl+R / F5 刷新");
            }
        }, true);
    }
    
  let isScrollMode = false;
  let mouseX = 0;
  const edgeThreshold = 50;
  const panelRef: HTMLDivElement | null = null;

  const indicatorOpacity = tweened(0, { duration: 150, easing: cubicOut });
  const toggleScrollMode = (enabled: boolean) => {
    isScrollMode = enabled;
    indicatorOpacity.set(enabled ? 1 : 0);
  };

  const handleMouseMove = (event: MouseEvent) => {
    mouseX = event.clientX;
  };
  const handleMouseDown = (event: MouseEvent) => {
    if (event.button === 1 && mouseX >= window.innerWidth - edgeThreshold) {
      event.preventDefault();
      toggleScrollMode(true);
    }
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (event.button === 2 && isScrollMode) {
      toggleScrollMode(false);
    }
  };

  const handleWheel = (event: WheelEvent) => {
    if (!isScrollMode) return;

    if (event.deltaY < 0) {
      console.log('Scroll up → previous category');
    } else if (event.deltaY > 0) {
      console.log('Scroll down → next category');
    }
  };

    setupGlobalShortcuts();
    window.addEventListener("keydown", (e) => {
                 if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
            e.preventDefault();
            console.log("阻止了刷新行为");
        }
    }, true);  
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
        const now = Date.now();
    let moving = false;
    let offsetX = 0;
    let offsetY = 0;
    let scrollPositionSaveTimeout: ReturnType<typeof setTimeout>


    const panelConfig = loadPanelConfig();

    let ignoreGrid = false;

    interface PanelConfig {
        top: number;
        left: number;
        expanded: boolean;
        scrollTop: number;
        zIndex: number;
    }
    function applyPanelConfig(config: PanelConfig, saveHistory = false) {
        if (saveHistory) {
            pushUndoState();
        }
        
        panelConfig.top = config.top;
        panelConfig.left = config.left;
        panelConfig.expanded = config.expanded;
        panelConfig.scrollTop = config.scrollTop;
        panelConfig.zIndex = config.zIndex === 0 ? 0 : ++$maxPanelZIndex;
        
        fixPosition();
        savePanelConfig();
        
        tick().then(() => {
            if (modulesElement) {
                modulesElement.scrollTop = panelConfig.scrollTop;
            }
        });
    }
    function clonePanelConfig(config: PanelConfig): PanelConfig {
        return {
            top: config.top,
            left: config.left,
            expanded: config.expanded,
            scrollTop: config.scrollTop,
            zIndex: config.zIndex
        };
    }

    function pushUndoState() {
        undoStack.push(clonePanelConfig(panelConfig));

        
        if (undoStack.length > 100) {
            undoStack.shift();
        }

        redoStack = [];
    }
    function fixPosition() {
        panelConfig.left = clamp(panelConfig.left, 0, document.documentElement.clientWidth * (2 / $scaleFactor) - panelElement.offsetWidth);
        panelConfig.top = clamp(panelConfig.top, 0, document.documentElement.clientHeight * (2 / $scaleFactor) - panelElement.offsetHeight);
    }

    function clamp(number: number, min: number, max: number) {
        return Math.max(min, Math.min(number, max));
    }

    function loadPanelConfig(): PanelConfig {
        const localStorageItem = localStorage.getItem(
            `clickgui.panel.${category}`,
        );

        if (!localStorageItem) {
            return {
                top: panelIndex * 50 + 20,
                left: 20,
                expanded: false,
                scrollTop: 0,
                zIndex: 0
            };
        } else {
            const config: PanelConfig = JSON.parse(localStorageItem);

                         if (!config.zIndex) {
                config.zIndex = 0;
            }

            if (config.zIndex > $maxPanelZIndex) {
                $maxPanelZIndex = config.zIndex;
            }

            if (config.expanded) {
                renderedModules = modules;
            }

            return config;
        }
    }

    async function savePanelConfig() {
    const cloned = clonePanelConfig(panelConfig);
    await setItem(
        `clickgui.panel.${category}`,
        JSON.stringify(cloned)
    );
}

    function onMouseDown(e: MouseEvent) {
        if (e.button !== 0 && e.button !== 1) return;

        moving = true;
        offsetX = e.clientX * (2 / $scaleFactor) - panelConfig.left;
        offsetY = e.clientY * (2 / $scaleFactor) - panelConfig.top;
        panelConfig.zIndex = ++$maxPanelZIndex;
        $showGrid = $snappingEnabled;
    }

    function onMouseMove(e: MouseEvent) {
        if ($locked) { 
      console.log("面板已锁定，无法拖动");
      e.stopImmediatePropagation();
      return;
    }
        if (moving) {
            const newLeft = (e.clientX * (2 / $scaleFactor) - offsetX);
            const newTop = (e.clientY * (2 / $scaleFactor) - offsetY);

            panelConfig.left = snapToGrid(newLeft);
            panelConfig.top = snapToGrid(newTop);

            fixPosition();
        }
    }

    function onMouseUp() {
        if (moving) {
            savePanelConfig();
        }
        moving = false;
        $showGrid = false;
    }

    function toggleExpanded() {
        if ($filteredModules.length > 0) return;
        
        pushUndoState();          panelConfig.expanded = !panelConfig.expanded;
        
        setTimeout(() => {
            fixPosition();
            savePanelConfig();
        }, 500);
    }
    function handleModulesScroll() {
        panelConfig.scrollTop = modulesElement.scrollTop;

        if (scrollPositionSaveTimeout !== undefined) {
            clearTimeout(scrollPositionSaveTimeout);
        }
        scrollPositionSaveTimeout = setTimeout(() => {
            savePanelConfig();
            pushUndoState();          }, 500)
    }

    highlightModuleName.subscribe((name) => {
        const index = modules.findIndex((m) => m.name === name);
        if (index !== -1) {
            panelConfig.zIndex = ++$maxPanelZIndex;
            panelConfig.expanded = true;
            renderedModules = modules;

                         tick().then(() => {
                const moduleEls = modulesElement.querySelectorAll('.module');
                const targetEl = moduleEls[index] as HTMLElement;

                if (targetEl) {
                    modulesElement.scrollTo({
                        top: targetEl.offsetTop - 20,                          behavior: 'smooth'
                    });
                }
            });

            savePanelConfig();
        }
    });

    listen("moduleToggle", (e: ModuleToggleEvent) => {
        const moduleName = e.moduleName;
        const moduleEnabled = e.enabled;

        const mod = modules.find((m) => m.name === moduleName);
        if (!mod) return;

        pushUndoState();          mod.enabled = moduleEnabled;
        modules = modules;
        if (panelConfig.expanded) {
            renderedModules = modules;
        }
    });

    onMount(() => {
        fixPosition();
        const keydownHandler = (e: KeyboardEvent) => {
            handleKeydown(e);          };
        const keyupHandler = (e: KeyboardEvent) => {
            handleKeyup(e);          };
        window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('wheel', handleWheel, { passive: false });

        window.addEventListener("keydown", keydownHandler, true);          window.addEventListener("keyup", keyupHandler, true);
        window.addEventListener('keydown', handleKeydown);
        return () => {
            window.removeEventListener("keydown", keydownHandler, true);
            window.removeEventListener("keyup", keyupHandler, true);
            window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('wheel', handleWheel);

        };
    });
    function handleKeydown(e: KeyboardEvent) {
  console.log(`KEYDOWN: ctrl=${e.ctrlKey}, shift=${e.shiftKey}, key=${e.key}`);

  if (e.key === "Shift") {
    ignoreGrid = true;
  }

  const key = e.key.toLowerCase();

  if (e.altKey && !e.ctrlKey && !e.metaKey && ['r', 's', 'l', 'd', 'e', 'a', 'z', 'y', 'n'].includes(key)) {
    e.preventDefault();

    const now = Date.now();

    switch (key) {
      case "l": {
        if (now - lastLockToggleTime < 2000) break;
        lastLockToggleTime = now;

        locked.update(current => {
          const next = !current;
          lockAnimation.set(next ? 'lock' : 'unlock');
          showLockHint.set(true);

          setTimeout(() => {
            lockAnimation.set(null);
            showLockHint.set(false);
          }, 2000);

          return next;
        });
        break;
      }

      case "s": {
        if (now - lastSaveTime < 2000) break;
        lastSaveTime = now;

        savedConfig = JSON.parse(JSON.stringify(panelConfig));
        console.log("布局参数已保存");

        glowState.set(true);
        setTimeout(() => glowState.set(false), 1500);
        break;
      }

      case "r": {
        if (savedConfig) {
          applyPanelConfig(savedConfig);
          console.log("布局参数已加载");
        }
        break;
      }

      case "n": {
        localStorage.removeItem(`clickgui.panel.${category}`);
        const initialConfig = loadPanelConfig();
        applyPanelConfig(initialConfig, true);
        console.log("布局已重置为初始状态");
        break;
      }

      case "d":
        filterMode = 'disabled';
        console.log("只显示未开启模块");
        break;

      case "e":
        filterMode = 'enabled';
        console.log("只显示已开启模块");
        break;

      case "a":
        filterMode = 'all';
        console.log("显示所有模块");
        break;
    }
  }
}
    function handleKeyup(e: KeyboardEvent) {
        if (e.key === "Shift") {
            ignoreGrid = false;
        }
    }

    function snapToGrid(value: number): number {
        if (ignoreGrid || !$snappingEnabled) return value;

        return Math.round(value / $gridSize) * $gridSize;
    }
</script>
<div
  class="scroll-indicator"
  style="opacity: {$indicatorOpacity}"
></div>
<svelte:window on:mouseup={onMouseUp} on:mousemove={onMouseMove} on:keydown={handleKeydown} on:keyup={handleKeyup}/>
<div class="panel-wrapper"
    class:expanded={panelConfig.expanded}
    style="left: {panelConfig.left}px; top: {panelConfig.top}px; z-index: {panelConfig.zIndex};"
    in:fly|global={{y: -30, duration: 250, easing: expoInOut}}
    out:fly|global={{y: -30, duration: 250, easing: expoInOut}}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="panel"
    class:locked={$locked}
    class:glowing={$glowState}
    bind:this={panelElement}
    on:mousedown={onMouseDown}>
    
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="title" 
            on:mousedown={onMouseDown}
            on:contextmenu|preventDefault={toggleExpanded}>
            <img
                class="icon"
                src="img/clickgui/icon-{category.toLowerCase()}.svg"
                alt="icon" />
            <span class="category">{category === 'Client' ? 'Client' : category}</span>

            <!-- 状态指示器移动到这里 -->
            {#if $lockAnimation}
            <div class="status-indicator { $locked ? 'locked' : '' }">
              <div class="icon-wrapper { $lockAnimation === 'lock' ? 'lock-animation' : '' } { $lockAnimation === 'unlock' ? 'unlock-animation' : '' }">
                {#if $locked}
                  <!-- 锁定图标 -->
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3a4 4 0 0 1 4 4v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V7a4 4 0 0 1 4-4m0 2a2 2 0 0 0-2 2v3h4V7a2 2 0 0 0-2-2Z"/>
                  </svg>
                {:else}
                  <!-- 解锁图标 -->
                  <svg viewBox="0 0 24 24">
                    <path d="M18 8h-1V7a5 5 0 0 0-9.9-1.2l2 1.5A3 3 0 0 1 15 7v1H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Z"/>
                  </svg>
                {/if}
              </div>
            </div>
          {/if}

            <!-- svelte-ignore a11y_consider_explicit_label -->
            <button class="expand-toggle" on:click={toggleExpanded}>
                <div class="icon" class:expanded={panelConfig.expanded || $filteredModules.length > 0}></div>
            </button>
        </div>

        <div class="modules"
            on:scroll={handleModulesScroll}
            bind:this={modulesElement}
            style="--duration: 0.3s">
            {#each renderedModules as {name, enabled, description, aliases}, i (name)} 
            <div>
                <Module
                    {name}
                    {enabled}
                    {description}
                    {aliases}
                />
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
@keyframes glowPulse {
    0% {
        box-shadow: 0 0 0px rgba(0, 255, 128, 0);
    }
    50% {
        box-shadow: 0 0 20px 6px rgba(0, 255, 128, 1);
    }
    100% {
        box-shadow: 0 0 0px rgba(0, 255, 128, 0);
    }
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
.panel-wrapper {
  position: absolute;
  border-radius: 12px;
  padding: 4px;
  background:transparent;
  box-shadow: 0 0 10px rgba($base, 0.4);
  transition: all 0.5s ease;

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
    will-change: transform, opacity;
    background-color: rgba($base, 0.5);
    border-radius: 8px;
    height: 100%;
    box-sizing: border-box;
    box-shadow: 0 0 8px rgba($accent-color, 0.6);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
}
.panel.glowing {
    box-shadow: 0 0 16px 4px rgba($accent-color, 0.8);
    animation: glowPulse 1.5s ease-out;
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
  backdrop-filter: blur(2px);    border-radius: 8px 8px 0 0;
  transition: all 0.3s ease;
  position: relative;  
  padding-right: 80px;
  .panel:not(.expanded) & {
    background: rgba($base, 0.8);
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