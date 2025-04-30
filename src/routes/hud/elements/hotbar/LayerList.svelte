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
  
    maybeAnimateBar("armor", prev.armor, newData.armor, 20);
    maybeAnimateBar("air", prev.air, newData.air, newData.maxAir);
    maybeAnimateBar("food", prev.food, newData.food, 20);
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
  type StatusBarConfig = {
    key: BarKey;
    condition: () => boolean;
    max: number | (() => number);
    value: () => number | undefined;
    color: string;
    icon?: string;
    label?: () => string | undefined;
    alignRight?: boolean;
  };
  const statusBars: StatusBarConfig[] = [
    {
      key: "air", 
      condition: () => playerData?.air !== undefined && playerData?.maxAir !== undefined && playerData.air < playerData.maxAir, 
      max: () => playerData?.maxAir ?? 0, 
      value: () => playerData?.air, 
      color: barColors.air,
      alignRight: false
    },
    {
      key: "armor", 
      condition: () => playerData?.armor !== undefined && playerData.armor > 0, 
      max: 20, 
      value: () => playerData?.armor, 
      color: barColors.armor,
      icon: "shield", 
      alignRight: false
    },
    {
      key: "food", 
      condition: () => playerData?.food !== undefined && playerData.food > 0, 
      max: 20, 
      value: () => playerData?.food, 
      color: barColors.food,
      icon: "food", 
      alignRight: false
    },
  ];

</script>
{#if playerData && playerData.gameMode !== "spectator"}
  <div class="hotbar">
    {#if overlayMessage}
      <div class="overlay-message" out:fade={{duration: 200}}
           style="max-width: {slotsElement?.offsetWidth ?? 0}px">
        <TextComponent fontSize={14} textComponent={overlayMessage.text}/>
      </div>
    {/if}
    {#if showItemStackName && itemStackName}
      <div class="item-name" out:fade={{duration: 200}}>
        <TextComponent fontSize={14} textComponent={itemStackName}/>
      </div>
    {/if}
    {#each statusBars as bar (bar.key)}
      {#if bar.condition()}
        <Status
          max={typeof bar.max === "function" ? bar.max() : bar.max}
          value={bar.value() ?? 0}
          color={bar.color}
          icon={bar.icon}
          label={bar.label?.()}
          alignRight={bar.alignRight}
          animateFrom={barAnimations[bar.key]?.from}
          onDone={() => barAnimations[bar.key] = null}
        />
      {/if}
    {/each}
    <div class="hotbar-elements">
      <!-- svelte-ignore element_invalid_self_closing_tag -->
      <div class="slider" style="left: {currentSlot * 45}px" />
      <div class="slots" bind:this={slotsElement}>
        {#each Array(9) as _, i}
          <!-- svelte-ignore element_invalid_self_closing_tag -->
          <div class="slot" />
        {/each}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @import "../../../../colors.scss";
  .hotbar {
    .hotbar-elements {

  background-color: transparent;
  position: relative;
  box-shadow: none;
  overflow: visible; 

  .slider {
    display: none;
  }

  .slots {
    display: flex;
    opacity: 0;
  }

  .slot {
    height: 45px;
    width: 45px;
  }
}
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
  }
</style>