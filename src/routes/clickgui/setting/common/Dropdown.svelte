<script lang="ts">
  import {createEventDispatcher} from "svelte";
  import {convertToSpacedString, spaceSeperatedNames} from "../../../../theme/theme_config";
    import { fade, fly } from "svelte/transition";
    import { flip } from "svelte/animate";

  export let name: string | null;
  export let options: string[];
  export let value: string;

  const dispatch = createEventDispatcher();

  let expanded = false;
  let dropdownHead: HTMLElement;

  function windowClickHide(e: MouseEvent) {
      if (!dropdownHead.contains(e.target as Node)) {
          expanded = false;
      }
  }

  function updateValue(v: string) {
      value = v;
      dispatch("change");
  }
</script>

<svelte:window on:click={windowClickHide} />

<!-- Dropdown container -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="dropdown" class:expanded on:click={() => (expanded = !expanded)}>
  <!-- Dropdown head (clickable area) -->
  <div class="head" bind:this={dropdownHead}>
      {#if name !== null}
          <span class="text">{$spaceSeperatedNames ? convertToSpacedString(name) : name}
              &bull; {$spaceSeperatedNames ? convertToSpacedString(value) : value}</span>
      {:else}
          <span class="text">{$spaceSeperatedNames ? convertToSpacedString(value) : value}</span>
      {/if}
  </div>

  {#if expanded}
  <div class="overlay" on:click={() => (expanded = false)}>
      <div class="options" in:fly={{ y: 20, duration: 200 }} out:fade={{ duration: 150 }}>
          {#each options as o (o)}  <!-- 添加了key (o) -->
              <div
                  class="option"
                  class:active={o === value}
                  on:click={() => updateValue(o)}
                  animate:flip={{ duration: 200 }}
              >
                  <span class="option-content">
                      {$spaceSeperatedNames ? convertToSpacedString(o) : o}
                  </span>
                  {#if o === value}
                      <svg class="checkmark" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                      </svg>
                  {/if}
              </div>
          {/each}
      </div>
  </div>
{/if}
</div>

<style lang="scss">
@use "../../../../colors.scss" as *;

.dropdown {
  position: relative;

  &.expanded {
    .text::after {
      transform: translateY(-50%) rotate(0);
      opacity: 1;
    }

    .head {
      border-radius: 3px 3px 0 0;
      border: 4px solid rgba($text, 0.3); // 高亮边框
      box-shadow: 0 4px 16px rgba($text, 0.4); // 高亮阴影
    }
  }
}

.head {
  background: rgba($base, 0.15);
  border: 2px solid rgba($text, 0.1);
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  position: relative;
  border-radius: 6px;
  transition:
    border-radius 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: rgba($text, 0.2);
    box-shadow: 0 4px 12px rgba($text, 0.15);
    background: rgba($base, 0.25);
  }

  .text {
    font-weight: 500;
    color: $text;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-right: 24px;
    position: relative;
    z-index: 1;
  }

  .text::after {
    content: "";
    display: block;
    position: absolute;
    height: 12px;
    width: 12px;
    right: 8px;
    top: 50%;
    background-position: center;
    background-repeat: no-repeat;
    transform-origin: 50% 50%;
    transition:
      opacity 0.25s ease,
      transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
    z-index: 1;
  }
}


.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  .options {
    background: rgba($mantle, 0.95);
    border-radius: 12px;
    padding: 16px 8px;
    width: min(90%, 500px);
    max-height: 500px;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba($text, 0.1);
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba($text, 0.3);
      border-radius: 3px;
    }
    
    scrollbar-width: thin;
    scrollbar-color: rgba($text, 0.3) transparent;
  }
}

.option {
  color: $subtext0;
  font-weight: 500;
  font-size: 14px;
  padding: 12px 16px;
  margin: 4px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px;
  transition:
    background-color 0.25s ease,
    color 0.25s ease,
    transform 0.2s ease;
  position: relative;
  z-index:9999999999999 ;
  overflow: hidden;

  &:hover {
    background: rgba($text, 0.05);
    color: $text;
    transform: translateX(4px);
  }

  &.active {
    color: $accent-color;
    background: rgba($accent-color, 0.1);

    .checkmark {
      opacity: 1;
      transform: scale(1);
    }
  }

  .option-content {
    position: relative;
    z-index: 1;
  }

  .checkmark {
    width: 18px;
    height: 18px;
    opacity: 0;
    transform: scale(0.8);
    transition:
      opacity 0.25s ease,
      transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>