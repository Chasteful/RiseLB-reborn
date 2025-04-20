<script lang="ts">
  import { onMount } from "svelte";
  import { listen } from "../../../../integration/ws";
  import { getPlayerData } from "../../../../integration/rest";
  import type { ClientPlayerDataEvent, OverlayMessageEvent } from "../../../../integration/events";
  import type { HUDComponentSettings, PlayerData, TextComponent as TTextComponent } from "../../../../integration/types";

  import Status from "./Status.svelte";
  import Layer from "./Layer.svelte";
    import TextComponent from "../../../menu/common/TextComponent.svelte";
    import { fade } from "svelte/transition";

  let playerData: PlayerData | null = null;
  let overlayMessage: OverlayMessageEvent | null = null;
  let itemStackName: TTextComponent | string | null = null;

  let currentSlot = 0;
  let lastSlot = 0;
  let slotsElement: HTMLElement;

  let showItemStackName = false;
  const timeouts = new Map<string | number ,NodeJS.Timeout>();
  let experienceChange:{ from: number; to: number; max: number; color: string; onDone?: () => void; } | null | undefined = null;
 let airChange: { from: number; to: number; max: number; color: string; onDone?: () => void; } | null | undefined = null;
  let foodChange:{ from: number; to: number; max: number; color: string; onDone?: () => void; } | null | undefined = null;

  let healthChange: { from: number; to: number; max: number; color: string; onDone?: () => void; } | null | undefined = null;
  let absorptionChange: { from: number; to: number; max: number; color: string; onDone?: () => void; } | null | undefined = null;
  let armorChange: { from: number; to: number; max: number; color: string; onDone?: () => void; } | null | undefined = null;
  let maxAbsorption = 0;

  function resetTimeout(type: 'itemName' | 'overlay',) {
    clearTimeout(timeouts.get(type));
    timeouts.set(type, setTimeout(() => {
      if (type === 'itemName') showItemStackName = false;
      if (type === 'overlay') overlayMessage = null;
    }, type === 'itemName' ? 2000 : 3000));
  }

  function updatePlayerData(newData: PlayerData) {
    const prev = playerData;
    playerData = newData;

    if (prev) {
      if (newData.health < prev.health) {
        healthChange = {
          from: prev.health,
          to: newData.health,
          max: newData.maxHealth,
          color: "rgba(252, 65, 48, 0.4)",
        };
      }

      if (newData.absorption < prev.absorption) {
        absorptionChange = {
          from: prev.absorption,
          to: newData.absorption,
          max: Math.max(maxAbsorption, newData.absorption),
          color: "#D4AF37",
        };
      }

      if (newData.armor < prev.armor) {
        armorChange = {
          from: prev.armor,
          to: newData.armor,
          max: 20,
          color: "#49EAD6",
        };
      }
     
    if (newData.experienceProgress < prev.experienceProgress) {
      experienceChange = {
        from: prev.experienceProgress,
        to: newData.experienceProgress ,
        max:100,
        color:"#88C657"
      };
    }
    
         if (newData.air < prev.air) {
      airChange = {
        from: prev.air,
        to: newData.air,
        max:playerData.maxAir,
        color:"#AAC1E3"
      
      };
    }

         if (newData.food < prev.food) {
      foodChange = {
        from: prev.food,
        to: newData.food,
        max:20,
         color:"#B88458"
      };
    }
  }

    

    if (newData.absorption > maxAbsorption) {
      maxAbsorption = newData.absorption;
    }

    if (prev?.selectedSlot !== newData.selectedSlot) {
      lastSlot = prev?.selectedSlot ?? 0;
      currentSlot = newData.selectedSlot;
      if (newData.mainHandStack.identifier !== "minecraft:air") {
        itemStackName = newData.mainHandStack.displayName;
        showItemStackName = true;
        resetTimeout("itemName");
      }
    }
  }

  listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
    updatePlayerData(event.playerData);
  });

  listen("overlayMessage", (event: OverlayMessageEvent) => {
    overlayMessage = event;
    resetTimeout("overlay");
  });

  onMount(async () => {
    updatePlayerData(await getPlayerData());
  });
</script>

{#if playerData && playerData.gameMode !== "spectator"}
  <div class="hotbar">
    {#if overlayMessage !== null}
    <div class="overlay-message" out:fade={{duration: 200}}
         style="max-width: {slotsElement?.offsetWidth ?? 0}px">
        <TextComponent fontSize={14} textComponent={overlayMessage.text}/>
    </div>
{/if}
{#if showItemStackName && itemStackName !== null}
    <div class="item-name" out:fade={{duration: 200}}>
        <TextComponent fontSize={14} textComponent={itemStackName}/>
    </div>
{/if}
    <div class="status">
      <div class="pair">
      {#if playerData.armor > 0}
        <Status
          max={20}
          value={playerData.armor}
          color="#49EAD6"
          alignRight={false}
          enableAnimation={!!armorChange}
          prevValue={armorChange?.from}
          onDone={() => (armorChange = null)}>
          {#if armorChange}
            <Layer 
              from={armorChange?.from} 
              to={armorChange?.to} 
              max={20} 
              color="#49EAD6"
              alignRight={false} 
              onDone={() => (armorChange = null)} />
          {/if}
        </Status>
      {/if}
      {#if playerData.air < playerData.maxAir}
      <Status
        max={playerData.maxAir}
        value={playerData.air}
        color="#AAC1E3"
        alignRight={true}
        enableAnimation={!!airChange}
        prevValue={airChange?.from}
        onDone={() => {}}>
        {#if airChange}
          <Layer
            from={airChange?.from}
            to={airChange?.to}
            max={playerData.maxAir}
            color="#AAC1E3"
            alignRight={true}
            onDone={() => {}} />
        {/if}
      </Status>
    {/if}
  </div>

      {#if playerData.absorption > 0}
        <Status
          max={maxAbsorption}
          value={playerData.absorption}
          color="#D4AF37"
          alignRight={false}
          enableAnimation={!!absorptionChange}
          prevValue={absorptionChange?.from}
          icon="shield"
          onDone={() => (absorptionChange = null)}>
          {#if absorptionChange}
            <Layer 
              from={absorptionChange?.from} 
              to={absorptionChange?.to} 
              max={maxAbsorption}
              color="#D4AF37"
              alignRight={false} 
              onDone={() => (absorptionChange = null)} />
          {/if}
        </Status>
      {/if}
     
      {#if playerData.health > 0}
        <Status
          max={playerData.maxHealth}
          value={playerData.health}
          color="#FC4130"
          alignRight={false}
          enableAnimation={!!healthChange}
          prevValue={healthChange?.from}
          icon="heart"
          onDone={() => (healthChange = null)}>
          {#if healthChange}
            <Layer 
              from={healthChange?.from} 
              to={healthChange?.to} 
              max={playerData.maxHealth}
              color="#FC4130"
              alignRight={false} 
              onDone={() => (healthChange = null)} />
          {/if}
        </Status>
      {/if}
      {#if playerData.food > 0}
      <Status
        max={20}
        value={playerData.food}
        color="#B88458"
        alignRight={true}
        icon="food"
        enableAnimation={!!foodChange}
        prevValue={foodChange?.from}
        onDone={() => {}}>
        {#if foodChange}
          <Layer
            from={foodChange?.from}
            to={foodChange?.to}
            max={20}
            color="#B88458"
            alignRight={true}
            onDone={() => {}} />
        {/if}
      </Status>
   
    {/if}
    

      {#if playerData.experienceLevel > 0}
      <Status
        max={100}
        value={playerData.experienceProgress * 100}
        color="#88C657"
        alignRight={false}
        label={playerData.experienceLevel.toString()}
        enableAnimation={!!experienceChange}
        prevValue={experienceChange?.from}
        onDone={() => (experienceChange = null)}>
        {#if experienceChange}
          <Layer
            from={experienceChange?.from}
            to={experienceChange?.to}
            max={100}
            color="#88C657"
            alignRight={false}
            onDone={() => (experienceChange = null)} />
        {/if}
      </Status>
    {/if}
    </div> <!-- This is the closing div for the "status" div -->

    <div class="hotbar-elements">
      <div class="slider" style="left: {currentSlot * 45}px"></div>
      <div class="slots" bind:this={slotsElement}>
        {#each Array(9) as _, i}
          <div class="slot"></div>
        {/each}
      </div>
    </div>

    {#if playerData.offHandStack.identifier !== "minecraft:air"}
      <div class="offhand-slot"></div>
    {/if}
  </div>
{/if}

<style lang="scss">
  @import "../../../../colors.scss";
  .hotbar {

}

  .pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 25px;
  }

  .status {
    display: flex;
    flex-direction: column;
    margin-bottom: 5px;
    row-gap: 5px;
    column-gap: 20px;
  }

  .hotbar-elements {
    background-color: rgba(0, 0, 0, 0.4);
    position: relative;
    border-radius: 16px;
    box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.4);
    overflow: hidden;

    .slider {
      height: 45px;
      width: 45px;
      position: absolute;
      border-radius: 16px;
      transition: ease-in left 0.1s;
      background-color: rgba(0, 0, 0, 0.4);
      filter: blur(2px);
    }

    .slots {
      display: flex;
    }

    .slot {
      height: 45px;
      width: 45px;
    }
  }

  .offhand-slot {
    height: 45px;
    width: 45px;
    border-radius: 16px;
    background-color: rgba(0, 0, 0, 0.4);
    position: absolute;
    bottom: 0;
    left: -65px;
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
</style>
