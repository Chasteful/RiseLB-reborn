<script lang="ts">
    import { listen } from "../../../../integration/ws";
    import type { ClientPlayerDataEvent, PlayerInventory, PlayerInventoryEvent } from "../../../../integration/events";
    import type { PlayerData, ItemStack } from "../../../../integration/types";
    import ItemStackView from "./ItemStackView.svelte";
    import { onMount } from "svelte";
    import { getPlayerInventory, getPlayerData } from "../../../../integration/rest";
    import { fly } from "svelte/transition";
    import { expoInOut } from "svelte/easing";
    
    let inventorySlots: ItemStack[] = Array(36).fill({ identifier: "minecraft:air", count: 0 });
let mainHand: ItemStack | null = null;
let offHand: ItemStack | null = null;
let selectedSlot = 0;
$: reversedArmorSlots = [...inventorySlots].reverse();
function updatePlayerData(newData: PlayerData) {

  if (selectedSlot !== newData.selectedSlot) {
    selectedSlot = newData.selectedSlot;
 
  }
  
  if (newData.mainHandStack) {
    mainHand = newData.mainHandStack;
  }
  if (newData.offHandStack) {
    offHand = newData.offHandStack;
  }
}
function updateInventory(inventory: PlayerInventory) {
    inventorySlots = inventory.armor;
    }
  
listen("clientPlayerInventory", (event: PlayerInventoryEvent) => {
  updateInventory(event.inventory);
});

listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
  updatePlayerData(event.playerData);
});
  
onMount(async () => {
  const inventory = await getPlayerInventory();
  updateInventory(inventory);
  
  const playerData = await getPlayerData();
  updatePlayerData(playerData);
});
  
    function isValidStack(stack: ItemStack | null): boolean {
      return !!stack && stack.identifier !== "minecraft:air" && stack.count > 0;
    }
  </script>
  
  <div class="armoritems-hud"id="armoritemshud" transition:fly|global={{duration: 500, y: -50, easing: expoInOut}}>
    <div class="inventory-hud"></div>
        <div class="title">
          <span class="bar"></span>
          <span>ARMORITEMS HUD</span>
        </div>
      

        <div class="armor-items">
            {#each reversedArmorSlots as stack (stack.identifier + stack.count)}
              <ItemStackView {stack} />
            {/each}
            {#if isValidStack(offHand)}
              <ItemStackView stack={offHand!} />
            {/if}
          </div>
      </div>
      
  <style lang="scss">
      @import "../../../../colors";
      .armoritems-hud   {
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      padding: 6px 10px;
      width: fit-content;
      font-family: sans-serif;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      user-select: none;
      flex-direction: column;  
    }
      .armor-items {
  display: flex;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 6px;
  
}
.title {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
      font-weight: bold;
      margin-bottom: 6px;
    }
  
    .bar {
  width: 5px;
  height: 1.2em;
  background: linear-gradient(135deg, $Items-bar, $blue);
  background-size: 200% auto;
  background-position: 0% center;
  animation: gradientShift 2.5s ease infinite;
  margin-right: 6px;
  border-radius: 6px;
}
  
@keyframes gradientShift {
      0% { background-position: 0% center; }
      50% { background-position: 100% center; }
      100% { background-position: 0% center; }
  }
  </style>
  