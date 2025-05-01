<script lang="ts">
  import { listen } from "../../../integration/ws";
  import type { ClientPlayerDataEvent } from "../../../integration/events";
  import type { StatusEffect } from "../../../integration/types";
  import { fade, fly } from 'svelte/transition';
  import { expoInOut } from "svelte/easing";
  let effects: StatusEffect[] = [];
  listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
  effects = [...event.playerData.effects].sort((a, b) => {
    const lengthDiff = b.localizedName.length - a.localizedName.length;
    if (lengthDiff !== 0) return lengthDiff;
    return b.amplifier - a.amplifier;
  });
});
  function formatTime(duration: number): string {
    return new Date(((duration / 20) | 0) * 1000)
      .toISOString()
      .substring(14, 19);
  }
  function getWarnClass(ticks: number): string {
    const seconds = ticks / 20;
    if (seconds < 3) return "warn-1";
    if (seconds < 10) return "warn-2";
    if (seconds < 30) return "warn-3";
    return "";
  }
</script>
<div class="effects">
  {#each effects as e}
    <div
      class="effect {getWarnClass(e.duration)}"
      transition:fly={{duration: 700, y: 50, easing: expoInOut}}
    >
    <span 
        class="name" 
        style="color: {'#' + e.color.toString(16).padStart(6, '0')}"
        in:fade={{ delay: 100 }}
      >
        {e.localizedName} {e.amplifier + 1}
      </span>
      <span 
        class="duration"
        in:fade={{ delay: 200 }}
      >
        {formatTime(e.duration)}
      </span>
    </div>
  {/each}
</div>
<style lang="scss">
  @use "../../../colors.scss" as *;
  .effects {
    position: relative;
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-end;
    perspective: 1000px; 
    gap: -8px;
  }
  .effect {
    font-weight: 600;
    font-size: 18px;
    font-family: '汉仪文黑-85W', sans-serif;
    text-align: left;
    border-radius: 8px;
    transition: background 0.3s ease, transform 0.2s ease;
    display: flex; 
    align-items: center;
    gap: 4px; 
    transform-origin: right center;
    will-change: transform, opacity; 
    filter: drop-shadow(4px 4px 16px $mantle);
  &.warn-1 {
      color: #ff0000; 
      animation: pulse 0.5s infinite alternate;
      .duration {
        background: linear-gradient(135deg, #ff0000, #ff6666);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    &.warn-2 {
      color: #ff5555; 
      .duration {
        background: linear-gradient(135deg, #ff5555, #ff9999);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    &.warn-3 {
      color: #ff8c00; 
      .duration {
        background: linear-gradient(135deg, #ff8c00, #ffbb66);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
    &:not(.warn-1):not(.warn-2):not(.warn-3) .duration {
      color: rgba(255, 255, 255, 0.8);
      text-shadow:0 2px 8px rgba($base,0.7);
    }}
  @keyframes pulse {
    from {
      opacity: 1;
    }
    to {
      opacity: 0.7;
    }
  }
</style>
