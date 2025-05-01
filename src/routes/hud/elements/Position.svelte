<script lang="ts">
  import { listen } from "../../../integration/ws";
  import { getClientInfo, getSession } from "../../../integration/rest";
  import type { ClientPlayerDataEvent } from "../../../integration/events";
  import type { ClientInfo, PlayerData, Session} from "../../../integration/types";
  import { onMount } from "svelte";
  import { tweened } from 'svelte/motion';
  import { cubicOut} from 'svelte/easing';
  import { writable } from 'svelte/store';


  let playerData: PlayerData | null = {
      position: { x: 0, y: 0, z: 0 },
  } as PlayerData;
  let clientInfo: ClientInfo | null = null;
  let lastX = 0;
  let lastZ = 0;
  let session: Session | null = null;
  const fpsAnimated = tweened(0, { duration: 500, easing: cubicOut });
  const fps = writable(0);
  const bps = tweened(0, { duration: 500, easing: cubicOut });
  const xPos = tweened(0, { duration: 500, easing: cubicOut });
  const yPos = tweened(0, { duration: 500, easing: cubicOut });
  const zPos = tweened(0, { duration: 500, easing: cubicOut });
  function roundToDecimal(value: number, decimal: number) {
  const rounded = Math.round(value * Math.pow(10, decimal)) / Math.pow(10, decimal);
  return rounded.toFixed(decimal);
}
  function formatCoordinate(value: number): string {
      return value.toFixed(1);
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
      return distanceMoved * tickrate;
  }
  async function updateClientInfo() {
  clientInfo = await getClientInfo();
  if (clientInfo) {
      
      if (clientInfo) {
      const floored = Math.floor(clientInfo.fps);
      fps.set(floored);
      fpsAnimated.set(floored);
  }
  }}
  async function updateSession() {
      session = await getSession();
  }
  onMount(async () => {
      updateClientInfo();
      updateSession();
      setInterval(async () => {
          updateClientInfo();
          updateSession();
      }, 1000);
  });
  listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
  if (playerData) {
    lastX = playerData.position.x;
    lastZ = playerData.position.z;
  }
  playerData = event.playerData;
  if (playerData) {
    xPos.set(playerData.position.x);
    yPos.set(playerData.position.y);
    zPos.set(playerData.position.z);
    const calculatedBps = getBPS(lastX, playerData.position.x, lastZ, playerData.position.z, 20);
    if (calculatedBps <= 200) {
      bps.set(calculatedBps);
    }
  }
});
  listen("session", async () => {
      await updateSession();
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
  .value {
    font-size: 20px;
      font-weight: bold;
      text-align: right;
      color: rgba(255, 255, 255, 0.8);
      font-family: '汉仪文黑-85W', sans-serif; 
}
  .label{
    font-size: 20px;
      font-weight: bold;
      text-align: right;     
       filter: drop-shadow(0 0 2px $text);
      color: rgba(255, 255, 255, 0.8);
      font-family: '汉仪文黑-85W', sans-serif;
      background-image: linear-gradient(45deg, $text 0%, $blue 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      background-size: 200% ;
      background-position: 0% center;
      -moz-animation: gradient 2s ease-in-out infinite;
      -webkit-animation: gradient 2s ease-in-out infinite;
      animation: gradient 2s ease-in-out infinite;
  }
  @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }
</style>

<div class="stats-container"  >
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
  <div class="stat" >
      <span class="label">XYZ: </span>
      <span class="value">
          {formatCoordinate($xPos)},
          {formatCoordinate($yPos)},
          {formatCoordinate($zPos)}
      </span>
  </div>
  {/if}
</div>