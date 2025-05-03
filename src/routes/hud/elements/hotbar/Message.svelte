<script lang="ts">
    import { onMount } from "svelte";
    import { fade } from "svelte/transition";
    import { listen } from "../../../../integration/ws";
    import { getPlayerData } from "../../../../integration/rest";
    import type { ClientPlayerDataEvent, OverlayMessageEvent } from "../../../../integration/events";
    import type { PlayerData, TextComponent as TTextComponent } from "../../../../integration/types";
    import TextComponent from "../../../menu/common/TextComponent.svelte";
    import Status from "./Status.svelte";
    import { TimeoutManager } from "./TimeoutManager";
  
    let playerData: PlayerData | null = null;
    let overlayMessage: OverlayMessageEvent | null = null;
    let itemStackName: TTextComponent | string | null = null;
    let currentSlot = 0;
    let lastSlot = 0;
    let slotsElement: HTMLElement;
    let showItemStackName = false;
    const timeouts = new TimeoutManager();
    let maxAbsorption = 0;
    const ITEM_NAME_TIMEOUT = 2000;
    const OVERLAY_TIMEOUT = 3000;
    type BarAnimation = {
      from: number;
      to: number;
      max: number;
      color: string;
    };
    type BarKey =  | 'armor'  | 'air' | 'food';
    let barAnimations: Record<BarKey, BarAnimation | null> = {
  
      armor: null,
      air: null,
      food: null
    };
    const barColors: Record<BarKey, string> = {
      armor: "#49EAD6",
      air: "#AAC1E3",
      food: "#B88458"
    };
    function maybeAnimateBar(key: BarKey, from: number | undefined, to: number | undefined, max: number | undefined) {
      if (from !== undefined && to !== undefined && max !== undefined && to < from) {
        barAnimations[key] = { from, to, max, color: barColors[key] };
      }
    }
    function updatePlayerData(newData: PlayerData) {
      const prev = playerData;
      playerData = newData;
      if (!prev) {
        if (newData.absorption !== undefined && newData.absorption > 0) {
          maxAbsorption = newData.absorption;
        }
        return;
      }
    
    
      if (newData.absorption !== undefined && newData.absorption > maxAbsorption) {
        maxAbsorption = newData.absorption;
      }
      if (prev.selectedSlot !== newData.selectedSlot) {
        lastSlot = prev.selectedSlot;
        currentSlot = newData.selectedSlot;
        if (newData.mainHandStack?.identifier !== "minecraft:air") {
          itemStackName = newData.mainHandStack?.displayName;
          showItemStackName = true;
          timeouts.set('itemName', () => showItemStackName = false, ITEM_NAME_TIMEOUT);
        }
      }
    }
    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
      updatePlayerData(event.playerData);
    });
    listen("overlayMessage", (event: OverlayMessageEvent) => {
      overlayMessage = event;
      timeouts.set('overlay', () => overlayMessage = null, OVERLAY_TIMEOUT);
    });
    onMount(async () => {
      updatePlayerData(await getPlayerData());
    });
  
  
  </script>
  {#if playerData && playerData.gameMode !== "spectator"}
    <div class="hotbar">
      {#if overlayMessage}
        <div class="overlay-message" out:fade={{duration: 200}}
             style="max-width: 200px">
          <TextComponent fontSize={14} textComponent={overlayMessage.text}/>
        </div>
      {/if}
      {#if showItemStackName && itemStackName}
        <div class="item-name" out:fade={{duration: 200}}>
          <TextComponent fontSize={14} textComponent={itemStackName}/>
        </div>
      {/if}
    </div>

  {/if}
  
  <style lang="scss">
    @import "../../../../colors.scss";

      .item-name {
        color: $hotbar-text-color;
        font-size: 14px;
        margin: 0 auto 15px;
        font-weight: 500;
        background-color: rgba($hotbar-base-color, 0.68);
        padding: 5px 8px;
        border-radius: 16px;
        width: max-content;
      }
      .overlay-message {
        text-align: center;
        color: $hotbar-text-color;
        margin-bottom: 15px;
        overflow: hidden;
      }
    
  </style>