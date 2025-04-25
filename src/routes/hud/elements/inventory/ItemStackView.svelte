<script lang="ts">
    import type {ItemStack, PlayerData} from "../../../../integration/types";
    import {REST_BASE} from "../../../../integration/host";
    import {mapToColor} from "../../../../util/color_utils";
    import {getPlayerData} from "../../../../integration/rest";
    import { onMount } from "svelte";
    export let stack: ItemStack;
    let playerData: PlayerData | null = null;

    const {count, damage, identifier, maxDamage, hasEnchantment } = stack;

    const countColor = count <= 0 ? "red" : "white";

    const valueColor = mapToColor(120 * (maxDamage - damage) / maxDamage);
    const itemIconUrl = `${REST_BASE}/api/v1/client/resource/itemTexture?id=${identifier}`;
    


onMount(async () => {
  playerData = await getPlayerData();
});

function isAir(stack: ItemStack): boolean {
  return stack.identifier === "minecraft:air" || stack.count <= 0;
}

</script>
  

<div class="item-stack">
    {#if hasEnchantment}
        <div class="mask" style="mask-image: url({itemIconUrl})"></div>
    {/if}
    <img class="item-icon" src={itemIconUrl} alt={identifier}/>

    {#if playerData && !isAir(playerData.mainHandStack)}
    <div class="mainHand-slot"></div>
  {/if}
  
  {#if playerData && !isAir(playerData.offHandStack)}
    <div class="offhand-slot"></div>
  {/if}

    <div class="durability-bar" class:hidden={damage === 0}>
        <div class="durability"
             style="width: {100 * (maxDamage - damage) / maxDamage}%; background-color: {valueColor}">
        </div>
    </div>

    <div class="count" class:hidden={count === 0 || count === 1} style="color: {countColor}">
        {count}
    </div>
</div>
<style lang="scss">
  @import "../../../../colors";

  .hidden {
    display: none;
  }

  .item-stack {
    position: relative;
    width: 32px;
    height: 32px;
  }

  .mask {
    position: absolute;
    background: radial-gradient(circle, rgba(112, 48, 160, 0.8), rgba(255, 105, 180, 0) 100%);
    mix-blend-mode: screen;
    scale: 105%;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    mask-size: cover;
  }

  .item-icon {
    width: 100%;
    height: 100%;
  }

  .durability-bar {
    position: absolute;
    bottom: 0;
    left: 10%;
    width: 80%;
    height: 2px;
    background-color: rgba($item-damage-base-color, 0.68);
  }

  .durability {
    height: 100%;
    transition: width 150ms;
  }

  .count {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 1px 1px black; // This is inconsistent with other UI elements but it looks better so I will let it pass ~Senk Ju
    font-family: monospace;
  }
</style>
