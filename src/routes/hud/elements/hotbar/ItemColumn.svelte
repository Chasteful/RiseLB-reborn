<script lang="ts">
    import { onMount } from "svelte";
    import type { ClientPlayerDataEvent, PlayerInventory, PlayerInventoryEvent } from "../../../../integration/events";
    import type { ItemStack, PlayerData } from "../../../../integration/types";
    import { listen } from "../../../../integration/ws";
    import { getPlayerData, getPlayerInventory } from "../../../../integration/rest";
    import ItemStackView from "../inventory/ItemStackView.svelte";
    import { fade, fly } from "svelte/transition";
    import { expoInOut } from "svelte/easing";

    let lastSlot = 0;
    let currentSlot = 0;
    let playerData: PlayerData | null = null;
    let hotbar: ItemStack[] = [];

function updateStacks(inventory: PlayerInventory) {
  hotbar = [...inventory.main.slice(0, 9)]; 
}


  function updatePlayerData(s: PlayerData) {
      playerData = s;

      currentSlot = playerData.selectedSlot;
      if (currentSlot !== lastSlot) {
          lastSlot = currentSlot;
     
          
      }
  }

  listen("clientPlayerInventory", (data: PlayerInventoryEvent) => {
    updateStacks(data.inventory);
});
listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
    updatePlayerData(event.playerData);
  });
onMount(async () => {
  const inventory = await getPlayerInventory();;
  updateStacks(inventory);
  updatePlayerData(await getPlayerData());
  });
  </script>
  
  <div class="item-column" in:fly={{ duration: 400, y: 20, easing: expoInOut }}>
    <!-- svelte-ignore element_invalid_self_closing_tag -->

    <div class="slider" style="left: {currentSlot * 45}px"in:fly={{ duration: 400, y: 20, easing: expoInOut }}></div>
    <div class="slots" in:fly={{ duration: 400, y: 20, easing: expoInOut }} >
      {#each hotbar as stack, i (stack)}
      <div class="slot" >
        <ItemStackView {stack} />
      </div>
    {/each}
      </div>
    </div>
  <style lang="scss">
    .item-column {
      position: relative;
      background-color: rgba(0, 0, 0, 0.4);
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
  display: flex;
  align-items: center;
  justify-content: center;
}
    }
  </style>