<script lang="ts">
    import { listen } from "../../../integration/ws";
    import { scale } from "svelte/transition";
    import type { BlockCountChangeEvent, ClientPlayerDataEvent } from "../../../integration/events";
    import type { HUDComponentSettings, PlayerData } from "../../../integration/types";
    import { expoInOut } from "svelte/easing";
    import { elasticOut, quintOut } from "svelte/easing";
         export let settings: HUDComponentSettings;
     export let editing: boolean;
    let count: number | undefined;
    let playerData: PlayerData | null = null;

    let lastX = 0;
    let lastZ = 0;

    function pop(node: Element, { delay = 0, duration = 400 }) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const transform = style.transform === 'none' ? '' : style.transform;

  return {
    delay,
    duration,
    css: (t: number) => {
      const eased = elasticOut(t);
      const fadeEased = quintOut(t);
      return `
        transform: ${transform} scale(${eased * 0.2 + 0.8});
        opacity: ${fadeEased * opacity};
      `;
    }
  };
}

function popOut(node: Element, { delay = 0, duration = 500 }) {
  const style = getComputedStyle(node);
  const opacity = +style.opacity;
  const transform = style.transform === 'none' ? '' : style.transform;

  return {
    delay,
    duration,
    css: (t: number) => {
      const progress = 1 - t;
            
                         const scaleProgress = progress < 0.5 
                ? easeOutQuad(progress * 2)                        : easeInQuad(1 - (progress - 0.5) * 2);              
            const scale = 1 + scaleProgress * 0.1; 
            
                         const opacityEased = progress < 0.5 
                ? 1 
                : easeInQuad(1 - (progress - 0.5) * 2);

            return `
                transform: ${transform} scale(${scale});
                opacity: ${opacity * opacityEased};
            `;
    }
  };
}

function easeOutQuad(t: number): number {
  return t * (2 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}
    listen("blockCountChange", (data: BlockCountChangeEvent) => {
        count = data.count;
    });

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
      if (playerData) {
        lastX = playerData.position.x;
        lastZ = playerData.position.z;
      }
      playerData = event.playerData;
    });

    function getProgressPercentage(value: number): number {
        return (value % 64) / 64 * 100;
    };

    function roundToDecimal(value: number, decimal: number) {
      return Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal)
    }

    function getBPS(
      lastX: number,
      currentX: number,
      lastZ: number,
      currentZ: number,
      tickrate: number
    ): number {
      const deltaX = currentX - lastX;
      const deltaZ = currentZ - lastZ;

      const distanceMoved = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
      const blocksPerSecond = distanceMoved * tickrate;

      return blocksPerSecond;
    }
</script>

{#if count !== undefined}
  <div class="notification" in:pop|global={{ duration: 400 }} out:popOut|global={{ duration: 500 }}>
    <div class="header">
      <span class="accent">Scaffold</span>
    </div>
    <div class="info">
      {count} blocks left
      {#if playerData}
        | {roundToDecimal(getBPS(lastX, playerData.position.x, lastZ, playerData.position.z, 20), 2)}m/s
      {/if}
    </div>
    <div class="progress-bar">
      <div class="progress" style="width: {getProgressPercentage(count)}%"></div>
    </div>
  </div>
{/if}


<style lang="scss">
  @use "../../../colors.scss" as *;

  .notification {
    background-color: rgba($base, 0.4);
    border-radius: 16px;
    padding: 12px;
    min-width: 200px;
    color: rgba($text, 0.7);
    box-shadow: 0px 0px 16px rgba($base, 0.4);
  
  }

  .header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 900;
    text-shadow: 0px 0px 10px $accent-color;
  }

  .accent {
    color: $accent-color;
  }

  .info {
    font-size: 14px;
    margin-top: 5px;
  }

  .progress-bar {
    margin-top: 10px;
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 5px;
    height: 10px;
    overflow: hidden;
  }

  .progress {
  height: 100%;
  border-radius: 100px;

  box-shadow: 0 0 36px rgba($accent-color, 0.6);


  background: linear-gradient(
      120deg,
      rgba($accent-color, 0.5) 25%,
      rgba($accent-color-2, 0.5) 50%,
      rgba($accent-color, 0.5) 75%
    );
    background-size: 200% 200%;
 animation: flowBorder 6s linear infinite, shadowFlow 6s linear infinite;  
}
@keyframes flowBorder {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 200%;  
  }
}
@keyframes shadowFlow {
  0% {
    box-shadow: 0 0 36px rgba($accent-color, 0.6);  
  }
  50% {
    box-shadow: 0 0 36px rgba($accent-color-2, 0.6);  
  }
  100% {
    box-shadow: 0 0 36px rgba($accent-color, 0.6);  
  }
}
</style>
