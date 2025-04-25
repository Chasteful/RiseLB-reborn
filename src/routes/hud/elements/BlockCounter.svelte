<script lang="ts">
  import { REST_BASE } from "../../../integration/host";
  import type { PlayerData } from "../../../integration/types";
  import type { BlockCountChangeEvent, ClientPlayerDataEvent } from "../../../integration/events";
  import { listen } from "../../../integration/ws";
  import { getPlayerData } from "../../../integration/rest";
  import { onMount } from "svelte";

  let playerData: PlayerData | null = null;
  let count: number | undefined;


  listen("blockCountChange", (e: BlockCountChangeEvent) => {
    count = e.count;
  });

  listen("clientPlayerData", (e: ClientPlayerDataEvent) => {
  playerData = e.playerData;
});


  onMount(async () => {
    playerData = await getPlayerData();
  });

  function isAirItem(identifier: string): boolean {
    return identifier.includes("air");
  }
</script>

{#if count !== undefined}
  <div class="hud">
    <div class="blocks-icon">
      {#if playerData?.mainHandStack && !isAirItem(playerData.mainHandStack.identifier)}
        <div class="item-box">
          <div class="content">
            <!-- svelte-ignore element_invalid_self_closing_tag -->
            <div class="bg" />
            <img
              class="icon"
              src="{REST_BASE}/api/v1/client/resource/itemTexture?id={playerData.mainHandStack.identifier}"
              alt={playerData.mainHandStack.identifier}
            />
          </div>
        </div>
      {/if}
    </div>
    <div class="count">{count}</div>
    <div class="pointer"></div>
  </div>
{/if}

<style lang="scss">
  @use "../../../colors.scss" as *;

  .item-box {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    z-index: 0;
  }


  .icon {
    width: 24px;
    height: 24px;
    image-rendering: pixelated;
    z-index: 1;
    margin-bottom: 4px;
  }


  .hud {
    position: relative;
    width: 80px;
    padding: 8px 0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    text-align: center;
    color: #fff;
    font-family: monospace;
    user-select: none;
    box-shadow:
      0 0 16px rgba(20,20, 20, 0.8);
    animation: glow 2s infinite alternate;
  }

  .count {
    font-size: 18px;
    font-weight: bold;
  }

  .pointer {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid rgba(20, 20, 20, 0.8);
  }

</style>
