<script lang="ts">
    import type { ItemStack } from "../../../../integration/types";
    import { listen } from "../../../../integration/ws";
    import type { PlayerInventory, PlayerInventoryEvent } from "../../../../integration/events";
    import { getPlayerInventory } from "../../../../integration/rest";
    import ItemStackView from "./ItemStackView.svelte";
    import { onMount } from "svelte";
  
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
  
  <div class="inventory-hud">
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
      background-color: rgba(0, 0, 0, 0.5);
      border-radius: 6px;
      padding: 6px 10px;
      width: fit-content;
      font-family: sans-serif;
      color: white;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
      user-select: none;
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
      background-color: $Items-bar;
      margin-right: 6px;
      border-radius: 6px;
    }
  
    .container {
      display: grid;
      grid-template-columns: repeat(9, 32px); // 每格宽度固定
      gap: 4px;
    }
  </style>
  