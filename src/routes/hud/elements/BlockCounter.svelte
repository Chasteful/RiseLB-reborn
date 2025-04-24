<script lang="ts">
    import { listen } from "../../../integration/ws";
    import type { BlockCountChangeEvent, ClientPlayerDataEvent } from "../../../integration/events";
    import type { PlayerData } from "../../../integration/types";
    import { elasticOut, quintOut } from "svelte/easing";
         
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
      <span class="accent">BlockCounter</span>
    </div>
    <div class="info">
      {count} blocks left
      {#if playerData}
        | {roundToDecimal(getBPS(lastX, playerData.position.x, lastZ, playerData.position.z, 20), 2)}m/s
      {/if}
    </div>
    <div class="progress-bar">
      <div class="progress" style="width: {getProgressPercentage(count)}%">
        <div class="progress-shadow"></div>
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @use "../../../colors.scss" as *;

  .notification {
    background: linear-gradient(
      135deg,
      rgba($base, 0.6) 0%,
      rgba(darken($base, 5%), 0.5) 100%
    );
    backdrop-filter: blur(12px) brightness(1.2);
    -webkit-backdrop-filter: blur(12px) brightness(1.2);
    border-radius: 12px;
    padding: 16px;
    min-width: 240px;
    color: rgba($text, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.28),
      0 0 0 1px rgba(255, 255, 255, 0.03) inset;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .notification::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 50% 0%,
      rgba($accent-color, 0.15) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease;
  }



  .header {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
    letter-spacing: 0.5px;
  }

  .accent {
    color: $accent-color;
    text-shadow: 0 0 12px rgba($accent-color, 0.4);
  }

  .info {
    font-size: 14px;
    margin-top: 6px;
    opacity: 0.9;
    font-weight: 400;
  }

  .progress-bar {
    margin-top: 14px;
    background-color: rgba(255, 255, 255, 0.08);
    border-radius: 100px;
    height: 6px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  }

  .progress {
    height: 100%;
    border-radius: 100px;
    position: relative;
    transition: width 0.5s cubic-bezier(0.2, 0.8, 0.4, 1);
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        135deg,
        rgba($accent-color, 0.8) 10%,
        rgba($accent-color-2, 0.8) 90%
      );
      z-index: 1;
      transition: opacity 0.3s ease;
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.2) 50%,
        transparent 100%
      );
      animation: shine 2.5s infinite;
      z-index: 2;
      opacity: 0;
      transition: opacity 0.5s ease;
    }

    &:hover::after {
      opacity: 1;
    }
  }

  .progress-shadow {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 100%;
    transform: translateY(-50%);
    border-radius: inherit;
    box-shadow: 0 0 10px 2px rgba($accent-color, 0.4);
    opacity: 0;
    transition: opacity 0.3s ease, box-shadow 0.3s ease;
    animation: pulseShadow 2s infinite alternate;
  }

  .progress:hover .progress-shadow {
    opacity: 1;
    box-shadow: 0 0 15px 3px rgba($accent-color, 0.6);
  }

  @keyframes shine {
    0% {
      transform: translateX(-100%);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
    }
    100% {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes pulseShadow {
    0% {
      box-shadow: 0 0 10px 2px rgba($accent-color, 0.3);
    }
    100% {
      box-shadow: 0 0 15px 4px rgba($accent-color, 0.5);
    }
  }

  @keyframes flowBorder {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>