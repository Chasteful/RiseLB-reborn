<script lang="ts">
    import type { ItemStack } from "../../../../integration/types";
    import { listen } from "../../../../integration/ws";
    import type { PlayerInventory, PlayerInventoryEvent } from "../../../../integration/events";
    import { getPlayerInventory } from "../../../../integration/rest";
    import ItemStackView from "./ItemStackView.svelte";
    import { onMount } from "svelte";
    import { expoInOut } from "svelte/easing";
    import { fly } from "svelte/transition";

    let stacks: ItemStack[] = [];
    function updateStacks(inventory: PlayerInventory) {
      stacks = inventory.main.slice(9); 
    }
    listen("clientPlayerInventory", (data: PlayerInventoryEvent) => {
      updateStacks(data.inventory);
    });
    onMount(async () => {
      const inventory = await getPlayerInventory();
      updateStacks(inventory);
    });

  </script>
  
  <div class="inventory-hud" id="inventoryhud" transition:fly|global={{duration: 500, y: -50, easing: expoInOut}}>
    <div class="title">
      <span class="bar"></span>
      <span>INVENTORY HUD</span>
    </div>
    <div class="container">
      {#each stacks as stack (stack)}
        <ItemStackView {stack} />
      {/each}
    </div>
  </div>

  <style lang="scss">
    @import "../../../../colors";
    .inventory-hud {
      background-color: rgba($base, 0.5);
      border-radius: 6px;
      padding: 6px 10px;
      width: fit-content;
      color: white;
      box-shadow: 
  0 4px 16px rgba($base, 0.6),
  inset 0 0 10px rgba(255, 255, 255, 0.05);
      user-select: none;
    }
    .title {
      display: flex;
      align-items: center;
      font-size: 0.85rem;
      font-weight: bold;
      letter-spacing: 2px;
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
    .container {
      display: grid;
      grid-template-columns: repeat(9, 32px); // 每格宽度固定
      gap: 4px;
    }
  </style>
  