<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import {  getModules, getModuleSettings,  setTyping } from "../../integration/rest";
    import { groupByCategory } from "../../integration/util";
    import Panel from "./Panel.svelte";
    import Description from "./Description.svelte";
    import { fade } from "svelte/transition";
    import { listen } from "../../integration/ws";
    import Search from './Search.svelte';
    import {ResolutionScaler} from "./ResolutionScaler"
    import {
        showResults,showSearch
    } from "./clickgui_store";
    import {
        gridSize,
        showGrid,
        snappingEnabled,
        scaleFactor,
    } from "./clickgui_store";

    import type {
        ClickGuiValueChangeEvent,
        ScaleFactorChangeEvent
    } from "../../integration/events";
    import type {

        ConfigurableSetting,
        GroupedModules,
        Module,
        TogglableSetting
    } from "../../integration/types";
    import CtrlFTip from "./CtrlFTip.svelte";

    let resolutionScaler = new ResolutionScaler({
        baseResolution: { width: 1920, height: 1080 }
    });
    let categories: GroupedModules = {};
    let modules: Module[] = [];
    let minecraftScaleFactor = 2;
    let clickGuiScaleFactor = 1;
    $: {
        const resScale = resolutionScaler.getScaleFactor();
        scaleFactor.set(minecraftScaleFactor * clickGuiScaleFactor * resScale);
    }



    const applyValues = (configurable: ConfigurableSetting) => {

        clickGuiScaleFactor = configurable.value.find(v => v.name === "Scale")?.value as number ?? 1;
        const snappingValue = configurable.value.find(v => v.name === "Snapping") as TogglableSetting;
        $snappingEnabled = snappingValue?.value.find(v => v.name === "Enabled")?.value as boolean ?? true;
        $gridSize = snappingValue?.value.find(v => v.name === "GridSize")?.value as number ?? 10;

    };
    const handleResize = () => {
        requestAnimationFrame(() => {
            resolutionScaler.updateScaleFactor();
            scaleFactor.set(minecraftScaleFactor * clickGuiScaleFactor * resolutionScaler.getScaleFactor());
        });
    };


    onMount(async () => {
        resolutionScaler.updateScaleFactor();
        scaleFactor.set(minecraftScaleFactor * clickGuiScaleFactor * resolutionScaler.getScaleFactor());

        modules = await getModules();
        categories = groupByCategory(modules);

        const clickGuiSettings = await getModuleSettings("ClickGUI");
        applyValues(clickGuiSettings);

        await setTyping(false);


        window.addEventListener("resize", handleResize);

    });

    onDestroy(() => {
        window.removeEventListener("resize", handleResize);
    });



    listen("scaleFactorChange", (e: ScaleFactorChangeEvent) => {
        minecraftScaleFactor = e.scaleFactor;
    });


    listen("clickGuiValueChange", (e: ClickGuiValueChangeEvent) => {
        applyValues(e.configurable);
    });

</script>

<div class="clickgui" class:grid={$showGrid}
     style="transform: scale({$scaleFactor * 50}%); width: {2 / $scaleFactor * 100}vw; height: {2 / $scaleFactor * 100}vh;
     background-size: {$gridSize}px {$gridSize}px;">
    {#if $showResults}
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <div class="elegant-overlay" in:fade={{ duration: 300 }} out:fade={{duration:300}}/>
    {/if}
    <CtrlFTip showSearch={showSearch} />

    <Description />

    {#if $showSearch}
        <Search modules={structuredClone(modules)} />
    {/if}

    {#each Object.entries(categories) as [category, modules], panelIndex}
        <Panel {category} {modules} {panelIndex} />
    {/each}
</div>


<style lang="scss">
  @use "../../colors.scss" as *;

  $GRID_SIZE: 10px;

  .clickgui {
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    transform-origin: left top;
    &.grid {
      background-image:
              linear-gradient(to right, rgba($clickgui-grid-color, 0.3) 1px, transparent 1px),
              linear-gradient(to bottom, rgba($clickgui-grid-color, 0.3) 1px, transparent 1px);
      background-size: #{$GRID_SIZE}px #{$GRID_SIZE}px;
    }
  }
  .elegant-overlay {
    position: fixed;
    inset: 0;
    pointer-events: auto;

    background: radial-gradient(
                    ellipse at center,
                    rgba(0, 0, 0, 0) 0%,
                    rgba(0, 0, 0, 0.5) 100%
    );

    box-shadow: inset 0 0 60px 20px rgba(255, 255, 255, 0.03);




    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background:
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E"),
              linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.02) 100%);
    }


    opacity: 0;
    animation: elegant-appear 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;


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

</style>
