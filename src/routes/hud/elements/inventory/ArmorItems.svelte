<script lang="ts">
  import { listen } from "../../../../integration/ws";
  import type { ClientPlayerDataEvent, PlayerInventory, PlayerInventoryEvent } from "../../../../integration/events";
  import type { PlayerData, ItemStack } from "../../../../integration/types";
  import ItemStackView from "./ItemStackView.svelte";
  import { onMount } from "svelte";
  import { getPlayerInventory, getPlayerData } from "../../../../integration/rest";
  import { fly } from "svelte/transition";
  import { expoInOut } from "svelte/easing";
  import { armorDurabilityStore } from '../../elements/Island';

  $: if (armorSlots) {
    armorDurabilityStore.set({
      helmet: armorSlots[0]?.identifier !== 'minecraft:air' ? {
        identifier: armorSlots[0].identifier,
        displayName: armorSlots[0].displayName,   
        durability: armorSlots[0].maxDamage - armorSlots[0].damage,
        maxDurability: armorSlots[0].maxDamage
      } : null,
      chestplate: armorSlots[1]?.identifier !== 'minecraft:air' ? {
        identifier: armorSlots[1].identifier,
        displayName: armorSlots[1].displayName,
        durability: armorSlots[1].maxDamage - armorSlots[1].damage,
        maxDurability: armorSlots[1].maxDamage
      } : null,
      leggings: armorSlots[2]?.identifier !== 'minecraft:air' ? {
        identifier: armorSlots[2].identifier,
        displayName: armorSlots[2].displayName,
        durability: armorSlots[2].maxDamage - armorSlots[2].damage,
        maxDurability: armorSlots[2].maxDamage
      } : null,
      boots: armorSlots[3]?.identifier !== 'minecraft:air' ? {
        identifier: armorSlots[3].identifier,
        displayName: armorSlots[3].displayName,
        durability: armorSlots[3].maxDamage - armorSlots[3].damage,
        maxDurability: armorSlots[3].maxDamage
      } : null
    });
  }
  const EMPTY_SLOT: ItemStack = {
  identifier: "minecraft:air",
  count: 0,
  damage: 0,
  maxDamage: 0,
  displayName: "Air",
  hasEnchantment: false
};
  export let armorSlots: ItemStack[] = Array(36).fill(EMPTY_SLOT);
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
  try {
    const [inventory, playerData] = await Promise.all([
      getPlayerInventory().catch(e => null),
      getPlayerData().catch(e => null)
    ]);
    if (inventory) updateInventory(inventory);
    if (playerData) updatePlayerData(playerData);
  } catch (e) {
    console.error("Failed to load player data:", e);
  }
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
      background-color: rgba($base ,0.5);
      border-radius: 6px;
      padding: 6px 10px;
      width: fit-content;
      font-weight: bold;
      letter-spacing: 2px;
      color: white;         
      box-shadow: 
  0 4px 16px rgba($base, 0.6),
  inset 0 0 10px rgba(255, 255, 255, 0.05);
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
  