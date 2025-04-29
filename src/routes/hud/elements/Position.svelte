<script lang="ts">
    import { listen } from "../../../integration/ws";
    import { getClientInfo, getSession } from "../../../integration/rest";
    import type { ClientPlayerDataEvent } from "../../../integration/events";
    import type { ClientInfo, PlayerData, Session } from "../../../integration/types";
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut, expoInOut } from "svelte/easing";
    import { writable } from "svelte/store";
    import { fly } from "svelte/transition";
  
    let playerData: PlayerData | null = {
      position: { x: 0, y: 0, z: 0 },
    } as PlayerData;
  
    let clientInfo: ClientInfo | null = null;
    let session: Session | null = null;
  
    let lastX = 0, lastZ = 0;
    const fpsAnimated = tweened(0, { duration: 500, easing: cubicOut });
    const fps = writable(0);
    const bps = tweened(0, { duration: 500, easing: cubicOut });
    const xPos = tweened(0, { duration: 500, easing: cubicOut });
    const yPos = tweened(0, { duration: 500, easing: cubicOut });
    const zPos = tweened(0, { duration: 500, easing: cubicOut });
  
    const roundToDecimal = (value: number, decimal: number) =>
      (Math.round(value * 10 ** decimal) / 10 ** decimal).toFixed(decimal);
  
    const formatCoordinate = (value: number) => value.toFixed(1);
  
    const getBPS = (lx: number, cx: number, lz: number, cz: number, tickrate: number) => {
      const dx = cx - lx;
      const dz = cz - lz;
      return Math.sqrt(dx * dx + dz * dz) * tickrate;
    };
  
    async function updateClientInfo() {
      const info = await getClientInfo();
      if (info) {
        clientInfo = info;
        const newFps = Math.floor(info.fps);
        fps.update((current) => {
          if (current !== newFps) {
            fpsAnimated.set(newFps);
            return newFps;
          }
          return current;
        });
      }
    }
  
    async function initSession() {
      session = await getSession();
    }
  
    onMount(() => {
      updateClientInfo();
      initSession();
  
      const interval = setInterval(() => {
        updateClientInfo(); // FPS 需要每秒刷新
      }, 1000);
  
      return () => clearInterval(interval);
    });
  
    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
      if (playerData) {
        lastX = playerData.position.x;
        lastZ = playerData.position.z;
      }
      playerData = event.playerData;
  
      const { x, y, z } = playerData.position;
      xPos.set(x);
      yPos.set(y);
      zPos.set(z);
  
      const speed = getBPS(lastX, x, lastZ, z, 20);
      if (speed <= 200) {
        bps.set(speed);
      }
    });
  
    listen("session", async () => {
      session = await getSession();
    });
  </script>
  
<style lang="scss">
  @use "../../../colors.scss" as *;
  .stats-container {
      position: relative;
      display: flex;
      flex-direction: column;
      font-family: monospace;
      align-items: baseline;
  }
  .stat {
      display: flex;
      align-items: center;
      gap: 6px;
  }
  .label,.value {
      font-size: 20px;
      font-weight: bold;
      text-align: right;
      background: linear-gradient(135deg, $text, $blue);
      -webkit-background-clip: text;
      background-clip: text;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      -webkit-text-fill-color: transparent;
      background-size: 200% auto;
      background-position: 0% center;
      filter: drop-shadow(4px 4px 16px $mantle);
      animation: gradientShift 3s ease infinite;
  }
  @keyframes gradientShift {
      0% { background-position: 0% center; }
      50% { background-position: 100% center; }
      100% { background-position: 0% center; }
  }
</style>

<div class="stats-container"  transition:fly={{duration: 700, y: 50, easing: expoInOut}}>
  {#if clientInfo}
      <div class="stat">
          <span class="label">FPS: </span> 
          <span class="value">{$fps.toString().padStart(3, " ")}</span>
      </div>
  {/if}
  {#if playerData}
      <div class="stat">
          <span class="label">BPS: </span> 
          <span class="value">
              {roundToDecimal($bps, 2).toString().padStart(6, " ")}
          </span>
      </div>
  {/if}
  {#if playerData}
  <div class="stat">
      <span class="label">XYZ: </span>
      <span class="value">
          {formatCoordinate($xPos)},
          {formatCoordinate($yPos)},
          {formatCoordinate($zPos)}
      </span>
  </div>
  {/if}
</div>