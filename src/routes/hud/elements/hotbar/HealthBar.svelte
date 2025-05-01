<script lang="ts">
    import { listen } from "../../../../integration/ws";
    import { getPlayerData } from "../../../../integration/rest";
    import type { PlayerData } from "../../../../integration/types";
    import type { ClientPlayerDataEvent } from "../../../../integration/events";
    import { onMount, onDestroy } from "svelte";
  
   
    let playerData: PlayerData | null = null;
    function updatePlayerData(s: PlayerData) {
      playerData = s;
    }
    listen("clientPlayerData", (e: ClientPlayerDataEvent) => {
      updatePlayerData(e.playerData);
    });
    onMount(async () => {
      updatePlayerData(await getPlayerData());
    });
  
    $: health     = playerData ? playerData.health     : 0;
    $: absorption = playerData ? playerData.absorption : 0;
    $: max        = playerData ? playerData.maxHealth  : 1;
    $: total = Math.max(health + absorption, max, 1);
    $: healthPct = Math.min(Math.max(health / total, 0), 1) * 100;
    $: absorbPct = Math.min(Math.max(absorption / total, 0), 1) * 100;
  
    $: isLowHealth = health / max <= 0.25;
    let blink = false;
    let iv: ReturnType<typeof setInterval> | null = null;
    $: {
      if (isLowHealth && !iv) {
        iv = setInterval(() => (blink = !blink), 500);
      } else if (!isLowHealth && iv) {
        clearInterval(iv);
        iv = null;
        blink = false;
      }
    }
    onDestroy(() => iv && clearInterval(iv));
    $: bgFlash = isLowHealth && blink ? "rgba(251,114,90,0.6)" : "transparent";

    function hsvToRgba(h: number, s: number, v: number, a: number): string {
      h /= 360; s /= 100; v /= 100;
      let r = 0, g = 0, b = 0;
      const i = Math.floor(h * 6), f = h * 6 - i;
      const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
      }
      return `rgba(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)}, ${a})`;
    }
    $: hpColor = isLowHealth
      ? hsvToRgba(4, 60, 100, 0.7)
      : hsvToRgba(82, 68, 84, 0.7);
    $: abColor = "rgba(212,175,55,0.7)";
    $: barBgStyle = `linear-gradient(
      to bottom,
      ${bgFlash},
      rgba(154,216,31,0.1),
      rgba(20,20,20,0.5)
    )`;
    $: barStyle = `linear-gradient(to right,
      ${hpColor}   0%,
      ${hpColor}   ${healthPct}%,
      ${abColor}   ${healthPct + absorbPct}%,
      rgba(0,0,0,0.4) ${healthPct + absorbPct}%,
      rgba(0,0,0,0.4) 100%
    )`;
  </script>
{#if playerData && playerData.gameMode !== "spectator"}
<div class="hotbar">
  {#if playerData.gameMode !== "creative"}
    <div class="status-container">
      <div class="status-wrapper">
        <div class="level-stat">Lv. {playerData.experienceLevel}</div>
        <div
          class="bar"
          style="--bar-bg: {barBgStyle}; background: {barStyle};"
        ></div>
        <div class="text">
          {playerData.health}
          {#if playerData.absorption > 0}+{playerData.absorption}{/if}
          &nbsp;/&nbsp;{playerData.maxHealth}
        </div>
      </div>
    </div>
  {/if}
</div>
{/if}

<style lang="scss">
    .hotbar {
      display: flex;
      justify-content: center;
      margin-bottom: 6px;
    }
    
    .status-container {
      width: 100%;
      display: flex;
      justify-content: center; 
    }
    
    .status-wrapper {
      position: relative;
      width: 420px;      
      height: 13px;      
    }
    
    
    .bar {
      width: 100%;
      height: 14px;
      background: var(--bar-bg);
      clip-path: polygon(
    calc(2% + 0.5px) 0, 
    calc(98% - 0.5px) 0,
    100% 50%,
    calc(98% - 0.5px) 100%,
    calc(2% + 0.5px) 100%,
    0% 50%
  );
      border-radius: 7px;
      background-size: 100% 100%;
      background-repeat: no-repeat;
      transition: background 0.3s ease;
      position: relative; 
      z-index: 1;
    }
    
    
    .text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      color: #fff;
      letter-spacing: 1px;
      font-family: '汉仪文黑-85W', sans-serif;
      text-shadow:
        0 0 2px rgba(0,0,0,0.9),
        0 0 4px rgba(0,0,0,0.7),
        1px 1px 2px rgba(0,0,0,0.6),
       -1px -1px 2px rgba(0,0,0,0.6);
      z-index: 2;
    }
    
    
    .level-stat {
      position: absolute;
      right: 100%;        
      top: 50%;           
      transform: translateY(-50%);
      margin-right: 12px; 
      
      font-size: 14px;
      font-weight: bold;
      color: rgba(255, 255, 255, 0.85);
      text-shadow:
        0 0 2px rgba(0,0,0,0.9),
        0 0 4px rgba(0,0,0,0.7),
        1px 1px 2px rgba(0,0,0,0.6),
       -1px -1px 2px rgba(0,0,0,0.6);
      font-family: '汉仪文黑-85W', sans-serif;
      white-space: nowrap;
    }
    </style>
    