<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy, afterUpdate } from "svelte";
  import { convertToSpacedString, spaceSeperatedNames } from "../../../../theme/theme_config";
  import { fade, fly } from "svelte/transition";
  import { flip } from "svelte/animate";

  export let name: string | null;
  export let options: string[];
  export let value: string;

  const dispatch = createEventDispatcher();

  let expanded = false;
  let dropdownHead: HTMLElement;
  let overlayElement: HTMLDivElement;
  let optionsElement: HTMLDivElement;
  let optionRefs: HTMLElement[] = [];
  let optionOpacities: number[] = [];
  let isScrolling = false;

  function windowClickHide(e: MouseEvent) {
    if (!dropdownHead.contains(e.target as Node)) {
      expanded = false;
    }
  }

  function updateValue(v: string) {
    value = v;
    dispatch("change");
  }

  function handleScroll() {
    if (!overlayElement || !expanded || !optionsElement || optionRefs.length === 0) return;

    if (isScrolling) return;
    isScrolling = true;

    requestAnimationFrame(() => {
      const optionsRect = optionsElement.getBoundingClientRect();
      const optionsScrollTop = optionsElement.scrollTop;

      optionOpacities = optionRefs.map((option) => {
        const rect = option.getBoundingClientRect();
        const visibleHeight = Math.min(rect.bottom, optionsRect.bottom) - Math.max(rect.top, optionsRect.top);
        const visibleRatio = Math.min(1, Math.max(0, visibleHeight / rect.height));
        return Math.pow(visibleRatio, 0.5);
      });

      isScrolling = false;
    });
  }

  onMount(() => {
    optionOpacities = Array(options.length).fill(1); 
    window.addEventListener("scroll", handleScroll, { passive: true });
  });

  afterUpdate(() => {
    if (expanded && optionRefs.length > 0) {
      handleScroll(); 
    }
  });

  onDestroy(() => {
    window.removeEventListener("scroll", handleScroll);
  });
</script>


<svelte:window on:click={windowClickHide} />


<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="dropdown" class:expanded on:click={() => (expanded = !expanded)}>
  <div class="head" bind:this={dropdownHead}>
    {#if name !== null}
      <span class="text">
        {$spaceSeperatedNames ? convertToSpacedString(name) : name}
        &bull; {$spaceSeperatedNames ? convertToSpacedString(value) : value}
      </span>
    {:else}
      <span class="text">{$spaceSeperatedNames ? convertToSpacedString(value) : value}</span>
    {/if}
  </div>

  {#if expanded}
    <div class="overlay" bind:this={overlayElement} on:click={() => (expanded = false)}>
      <div
        class="options"
        bind:this={optionsElement}
        on:scroll={handleScroll}
        in:fly={{ y: 20, duration: 200 }}
        out:fade={{ duration: 150 }}
      >
        {#each options as o, index (o)}
          <div
            class="option"
            class:active={o === value}
            on:click={() => updateValue(o)}
            bind:this={optionRefs[index]}
            style="opacity: {optionOpacities[index] ?? 1};" 
            animate:flip={{ duration: 200 }}
          >
            <span class="option-content">
              {$spaceSeperatedNames ? convertToSpacedString(o) : o}
            </span>
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
      .head {
        border-color: rgba($accent-color, 0.4);
        box-shadow: 0 0 0 1px rgba($accent-color, 0.2), 0 8px 32px rgba(0, 0, 0, 0.3);

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
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    transition: z-index 0s linear 300ms; 
    .options {
  background: linear-gradient(
    145deg,
    rgba($base, 0.82) 0%,
    rgba(darken($base, 8%), 0.78) 100%
  );
  backdrop-filter: blur(32px);
  scroll-snap-type: y mandatory;
  scroll-padding-top: 8px;
  scroll-behavior: smooth;
  -webkit-backdrop-filter: blur(32px);
  border-radius: 14px;
  padding: 8px;
  
  width: min(90%, 420px);
  max-height: calc(25vh + 200px);
  overflow-y: auto;
  box-shadow: 
    0 16px 64px rgba(0, 0, 0, 0.32),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 0 0 2px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.12);

  &::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

&::-webkit-scrollbar-thumb {
  background: linear-gradient(
    to bottom,
    rgba($text, 0.15) 0%,
    rgba($text, 0.2) 50%,
    rgba($text, 0.15) 100%
  );
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  -webkit-backface-visibility: hidden;
  -webkit-transform: translateZ(0);
  transform: translate3d(0,0,0);
  will-change: transform;
  contain: content;
  transition: 
    background 0.3s ease-out,
    border-color 0.2s linear;
  
  /* 禁用可能引起问题的效果 */
  backdrop-filter: none;
}
&::-webkit-scrollbar-track {
  background: rgba($base, 0.1);
  border-radius: 0 4px 4px 0;
  -webkit-transform: translateZ(0);
}
&::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba($text, 0.3) 0%,
    rgba($text, 0.45) 50%,
    rgba($text, 0.3) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.1),
              0 0 6px rgba($text, 0.3);
  cursor: pointer;
}

&::-webkit-scrollbar-corner {
  background: transparent;
}

/* Add arrows to the scrollbar */
&::-webkit-scrollbar-button {
  background-color: rgba(255, 255, 255, 0.2);
  width: 16px; /* Adjust to fit your design */
  height: 16px; /* Adjust to fit your design */
  display: inline-block;
}
&::-webkit-scrollbar-button:vertical:decrement {
  background: transparent;
  background-repeat: no-repeat;
  background-position: center;
}

&::-webkit-scrollbar-button:vertical:increment {
    background: transparent;
  background-repeat: no-repeat;
  background-position: center;
}
    }
.option {
  padding: 14px 24px;
  margin: 2px 4px;
  border-radius: 8px;
  color: rgba($text, 0.85);
  font-size: 15px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.28s cubic-bezier(0.33, 1, 0.68, 1);
  position: relative;
  overflow: hidden;
  z-index:9999999999999 ;
  /* Subtle pinstripe effect */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.03) 20%,
      rgba(255,255,255,0.05) 50%,
      rgba(255,255,255,0.03) 80%,
      transparent 100%
    );
  }

  &:hover {
    background: rgba($text, 0.08);
    color: $text;
    transform: translateX(4px);
    
    &::after {
      opacity: 0.06;
    }
  }

  &.active {
    color: $accent-color;
    transform: translateX(4px) scale(0.98);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: linear-gradient(
      to right,
      rgba($accent-color, 0.08) 0%,
      rgba($accent-color, 0.12) 100%
    );
    box-shadow: 
      0 2px 8px rgba($accent-color, 0.1),
      0 0 0 1px rgba($accent-color, 0.15);
  }

  /* Sophisticated hover effect */
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at center,
        rgba($accent-color, 0.2) 0%,
        transparent 80%
      );
      opacity: 0.4;
      transition: opacity 0.3s ease, background 0.3s ease;
    pointer-events: none;
  }

  .option-content {
    position: relative;
    z-index: 1;
    letter-spacing: 0.02em;
  }
}


/* Refined animations */
@keyframes optionEnter {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

  }
  </style>
