<script lang="ts">
  import { onMount } from "svelte";
  import {
    getModuleSettings,
    setModuleSettings,
    setModuleEnabled,
  } from "../../integration/rest";
  import type { ConfigurableSetting } from "../../integration/types";
  import GenericSetting from "./setting/common/GenericSetting.svelte";
  import { fade, slide } from "svelte/transition";
  import { quintOut } from "svelte/easing";
  import { description as descriptionStore, highlightModuleName, scaleFactor } from "./clickgui_store";
  import { setItem } from "../../integration/persistent_storage";
  import { convertToSpacedString, spaceSeperatedNames } from "../../theme/theme_config";
  import { getContext } from "svelte";


  export let name: string;
  export let enabled: boolean;
  export let description: string;
  export let aliases: string[];

  let moduleNameElement: HTMLElement;
  let configurable: ConfigurableSetting;
  const path = `clickgui.${name}`;
  const modulesElement = getContext<HTMLElement>("modules-element");
  let expanded = false;

  onMount(async () => {
    configurable = await getModuleSettings(name);
    expanded = localStorage.getItem(path) === "true";
  });

  highlightModuleName.subscribe((name) => {
  if (!modulesElement || !name) return;

  const el = modulesElement.querySelector(`[data-module-name="${name}"]`);
  console.log('Found element to scroll:', el);    if (el instanceof HTMLElement) {
    console.log('scrolling to:', el.offsetTop);      modulesElement.scrollTo({
      top: el.offsetTop - 40,        behavior: "smooth",
    });
  }
});
  async function updateModuleSettings() {
    await setModuleSettings(name, configurable);
    configurable = await getModuleSettings(name);
  }

  async function toggleModule() {
    await setModuleEnabled(name, !enabled);
  }

  function setDescription() {
        if (!moduleNameElement) return;

        const boundingRect = moduleNameElement.getBoundingClientRect();
        const y = (boundingRect.top + (moduleNameElement.clientHeight / 2)) * (2 / $scaleFactor);

        let moduleDescription = description;
        if (aliases.length > 0) {
            moduleDescription += ` (aka ${aliases.map(name => $spaceSeperatedNames ? convertToSpacedString(name) : name).join(", ")})`;
        }

        
        if (window.innerWidth - boundingRect.right > 300) {
            const x = boundingRect.right * (2 / $scaleFactor);
            descriptionStore.set({
                x,
                y,
                anchor: "right",
                description: moduleDescription
            });
        } else {
            const x = boundingRect.left * (2 / $scaleFactor);

            descriptionStore.set({
                x,
                y,
                anchor: "left",
                description: moduleDescription
            });
        }
    }
  
  async function toggleExpanded() {
    expanded = !expanded;
    await setItem(path, expanded.toString());
  }
</script>

<div
  class="module"data-module-name={name}
  class:expanded
  class:has-settings={configurable?.value.length > 2}
  in:slide={{ duration: 300, easing: quintOut }}
  out:slide={{ duration: 200 ,easing: quintOut }}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="name"
    on:contextmenu|preventDefault={toggleExpanded}
    on:click={toggleModule}
    on:mouseenter={setDescription}
    on:mouseleave={() => descriptionStore.set(null)}
    bind:this={moduleNameElement}
    class:enabled
    class:highlight={name === $highlightModuleName}
  >
    {#if $spaceSeperatedNames}
      {convertToSpacedString(name)}
    {:else}
      {name}
    {/if}
  </div>

  {#if expanded && configurable}
    <div class="settings-wrapper" transition:slide={{ duration: 400, easing: quintOut }}>
      <div class="settings">
        {#each configurable.value as setting (setting.name)}
          <GenericSetting skipAnimationDelay={true} {path} bind:setting on:change={updateModuleSettings} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../../colors.scss" as *;
.module {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    position: relative;
    transition: transform 0.2s ease;
    overflow-y: auto;
    max-height: 100%;
    
    .name {
        cursor: pointer;
        text-align: center;
        font-size: 16px;
        font-weight: 500;
        padding: 10px;
        color: rgba(150, 150, 150);
        transition: all 0.3s ease-out;          position: relative;
        overflow: hidden;
        
                 &:hover {
            background: rgba($base, 0.2);
            color: gray;
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.4, 1);          }
        
                 &.enabled {
            position: relative;
            overflow: hidden;
            background: linear-gradient(135deg, rgba($accent, 0.3), rgba($accent-mix, 0.3));
            color: white;
            text-shadow: 0 0 12px rgba($accent, 0.7);
            transition: all 0.4s cubic-bezier(0.2, 0.8, 0.4, 1);
            box-shadow: 
                0 0 8px rgba($accent, 0.3),
                inset 0 0 10px rgba(white, 0.1);

            &:hover {
                background: linear-gradient(135deg, rgba($accent, 0.4), rgba($accent-mix, 0.4));
                text-shadow: 0 0 16px rgba($accent, 0.9);
                transition: all 0.3s ease-out;              }

            &:active {
                background: linear-gradient(135deg, rgba($accent-mix, 0.5), rgba($accent, 0.5));
                transform: scale(0.98);
                transition-duration: 0.2s;
            }
        }

                 &.highlight {
            background: linear-gradient(135deg, rgba($accent-color-2, 0.2), rgba($accent-color, 0.2));
            transition: all 0.3s ease-out;

            &::after {
                content: "";
                position: absolute;
                top: 50%;
                left: 50%;
                width: 100%;
                height: 100%;
                background: radial-gradient(circle, rgba($accent-color, 0.3), transparent 70%);
                transform: translate(-50%, -50%) scale(0);
                border-radius: 50%;
                transition: transform 0.4s ease-out, opacity 0.4s ease-out;                  opacity: 0.6;
            }

            &:hover::after {
                transform: translate(-50%, -50%) scale(1.2);
                opacity: 0.2;
                transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.4, 1), opacity 0.3s ease;              }
        }
    }


    .settings-wrapper {
  background: rgba($base, 0.3);
  border-radius: 14px;
  padding: 8px 10px;
  position: relative;
  box-shadow: 0 0 0 1px rgba($accent-color, 0.2),
              0 0 8px rgba($accent-color, 0.1),
              inset 0 0 4px rgba($accent-color-2, 0.05);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 0 0 1px rgba($accent-color, 0.4),
                0 0 12px rgba($accent-color, 0.3),
                inset 0 0 6px rgba($accent-color-2, 0.15);
  }
}



    &.expanded {
        overflow: visible;
        z-index: 2;
        transition: all 0.3s ease-out;
    }


 @keyframes subtle-pulse {
    0%, 100% { box-shadow: 0 0 8px rgba($accent, 0.3); }
    50% { box-shadow: 0 0 12px rgba($accent, 0.5); }
}

  &.has-settings .name::after {
    content: "";
    position: absolute;
    right: 15px;
    top: 50%;
    border-radius: 10px;
    width: 10px;
    height: 10px;
    background-image: url("");
    background-size: contain;
    background-repeat: no-repeat;
    transform: translateY(-50%) rotate(-90deg);
    opacity: 0.5;
    transition: transform 0.4s ease, opacity 0.2s ease;
  }

  &.expanded.has-settings .name::after {
    transform: translateY(-50%) rotate(0);
    opacity: 1;
  }
}
</style>