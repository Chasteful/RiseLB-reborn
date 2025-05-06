<script lang="ts">
  import { listen } from "../../../integration/ws";
  import { getClientInfo, getSession } from "../../../integration/rest";
  import type { ClientPlayerDataEvent } from "../../../integration/events";
  import type { ClientInfo, PlayerData, Session} from "../../../integration/types";
  import { onMount } from "svelte";
  import { tweened } from 'svelte/motion';
  import { cubicOut} from 'svelte/easing';
  import { writable } from 'svelte/store';
    import { throttle } from "lodash";


  let playerData: PlayerData | null = {
      position: { x: 0, y: 0, z: 0 },
  } as PlayerData;
  let clientInfo: ClientInfo | null = null;
  let lastX = 0;
  let lastZ = 0;
  let session: Session | null = null;
  const fpsAnimated = tweened(0, { duration: 300, easing: cubicOut });
  const fps = writable(0);
  const bps = tweened(0, { duration: 300, easing: cubicOut});
  const xPos = tweened(0, { duration: 300, easing: cubicOut });
  const yPos = tweened(0, { duration: 300, easing: cubicOut });
  const zPos = tweened(0, { duration: 300, easing: cubicOut });
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
  listen("clientPlayerData", throttle((event: ClientPlayerDataEvent) => {
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
}, 50));
  listen("session", async () => {
      await updateSession();
  });

</script><style lang="scss">
  @use "../../../colors.scss" as *;
  .stats-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: baseline;
      /* Promote to its own layer to isolate expensive effects */
      will-change: transform;
  }
  .stat {
      display: flex;
      align-items: center;
      gap: 6px;
  }
  .value, .label  {
    font-size: 20px;
    font-weight: bold;
    text-align: right;
    color: #bbbbbb;
    text-shadow: 0 0 3px rgba(170, 170, 170, 0.9);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    will-change: transform;
  }
  .value {
  position: relative;
  &::after {
    content: attr(data-value);
    position: absolute;
    top: 0;
    left: 0;
    color: transparent;
    text-shadow: 0 0 3px rgba(170, 170, 170, 0.9);
    z-index: -1;
  }
}
  .label {  
    background: linear-gradient(45deg, $text 0%, $blue 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
 
  }
</style>
<div class="stats-container">
  {#if clientInfo}
    {@const fpsValue = $fps.toString().padStart(3, " ")}
    <div class="stat">
      <span class="label">FPS:&nbsp;</span> 
      <span class="value">{fpsValue}</span>
    </div>
  {/if}
  
  {#if playerData}
    {@const bpsValue = roundToDecimal($bps, 2).toString().padStart(6, " ")}
    <div class="stat">
      <span class="label">BPS:&nbsp;</span> 
      <span class="value">{bpsValue}</span>
    </div>
    
    {@const x = formatCoordinate($xPos)}
    {@const y = formatCoordinate($yPos)}
    {@const z = formatCoordinate($zPos)}
    <div class="stat">
      <span class="label">XYZ:&nbsp;</span>
      <span class="value">{x}, {y}, {z}</span>
    </div>
  {/if}
</div>