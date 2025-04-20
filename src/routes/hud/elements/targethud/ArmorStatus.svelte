<script lang="ts">
  import { REST_BASE } from "../../../../integration/host";
  import type { ItemStack } from "../../../../integration/types";

  export let itemStack: ItemStack;

  const hasDurability = itemStack.maxDamage > 0;
  const isAir = itemStack.identifier.includes("air");

  $: value = hasDurability
    ? itemStack.maxDamage - itemStack.damage
    : itemStack.count;
</script>

<div class="item-box">
  <div class="content">
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <div class="bg" />
    {#if !isAir}
      <img
        class="icon"
        src="{REST_BASE}/api/v1/client/resource/itemTexture?id={itemStack.identifier}"
        alt={itemStack.identifier}
      />
      <div class="value">{value}</div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use "../../../../colors.scss" as *;

  .bg {
  position: absolute;
  inset: 0;
  background: transparent;   
  border-radius: 8px;
   
  box-shadow: none;
  z-index: 0;
}

.item-box {
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  z-index: 0;
}

.icon {
  width: 24px;
  height: 24px;
  image-rendering: pixelated;
  z-index: 1;
}

.value {
  font-size: 10px;
  color: white;
  text-shadow: 0 0 2px black;
  z-index: 1;
}

</style>
