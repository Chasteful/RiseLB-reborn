<script lang="ts">
  import { listen } from "../../../../integration/ws";
  import type { ClientPlayerDataEvent, PlayerInventory, PlayerInventoryEvent } from "../../../../integration/events";
  import type { PlayerData, ItemStack } from "../../../../integration/types";
  import ItemStackView from "./ItemStackView.svelte";
  import { onMount } from "svelte";
  import { getPlayerInventory, getPlayerData } from "../../../../integration/rest";
  import { fly } from "svelte/transition";
  import { expoInOut } from "svelte/easing";
  const EMPTY_SLOT: ItemStack = {
  identifier: "minecraft:air",
  count: 0,
  damage: 0,
  maxDamage: 0,
  displayName: "Air",
  hasEnchantment: false
};
  let armorSlots: ItemStack[] = Array(36).fill(EMPTY_SLOT);
  let offHand: ItemStack = EMPTY_SLOT;
  let selectedSlot = 0;
  function updatePlayerData(newData: PlayerData) {
    selectedSlot = newData.selectedSlot;
    offHand = newData.offHandStack || EMPTY_SLOT;
  }
  function updateInventory(inventory: PlayerInventory) {
    armorSlots = inventory.armor.map(slot => slot || EMPTY_SLOT);
  }
  listen("clientPlayerInventory", (event: PlayerInventoryEvent) => {
    updateInventory(event.inventory);
  });
  listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
    updatePlayerData(event.playerData);
  });
  onMount(async () => {
    const [inventory, playerData] = await Promise.all([
      getPlayerInventory(),
      getPlayerData()
    ]);
    updateInventory(inventory);
    updatePlayerData(playerData);
  });
  function shouldShowSlot(stack: ItemStack): boolean {
    return stack.identifier !== "minecraft:air" && stack.count > 0;
  }

</script>
<div class="armoritems-hud" id="armoritemshud" transition:fly|global={{duration: 500, y: -50, easing: expoInOut}}>
  <div class="inventory-hud"></div>
  <div class="title">
    <span class="bar"></span>
    <span>ARMOR HUD</span>
  </div>
  <div class="armor-items">
    {#each [...armorSlots].reverse() as stack (stack.identifier + stack.count)}
      {#if shouldShowSlot(stack)}
        <ItemStackView {stack} />
      {/if}
    {/each}
    {#if shouldShowSlot(offHand)}
      <ItemStackView stack={offHand} />
    {/if}
  </div>
</div>

  <style lang="scss">
      @import "../../../../colors";
      .armoritems-hud   {
      position: relative;
      min-width: 120px;
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      padding: 6px 10px;
      width: fit-content;
      font-family: 'Product Sans', system-ui, -apple-system, sans-serif;
      font-weight: bold;
      letter-spacing: 2px;
      color: white;    
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      user-select: none;
      white-space: nowrap;
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
      text-shadow:
    0 0 2px rgba(255, 255, 255, 0.7),  
    0 0 4px rgba(255, 255, 255, 0.5),  
    1px 1px 2px rgba(255, 255, 255, 0.4), 
    -1px -1px 2px rgba(255, 255, 255, 0.4); 

    }
    .bar {
  width: 5px;
  height: 1.2em;
  background: linear-gradient(135deg, $Items-bar, $blue);
  box-shadow: 2x 2px 4x $text;
  margin-right: 6px;
  border-radius: 6px;
}

  </style>
  