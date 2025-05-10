<script lang="ts">
    import type {ItemStack} from "../../../../integration/types";
    import {REST_BASE} from "../../../../integration/host";
    import {mapToColor} from "../../../../util/color_utils";
    export let index: ItemStack;

    const {count, damage, identifier, maxDamage, hasEnchantment } = index;
    const countColor = count <= 0 ? "red" : "white";
    const itemIconUrl = `${REST_BASE}/api/v1/client/resource/itemTexture?id=${identifier}`;

</script>
<div class="item-stack">
    {#if hasEnchantment}
        <div class="mask" style="mask-image: url({itemIconUrl})"></div>
    {/if}
    <img class="item-icon" src={itemIconUrl} alt={identifier}/>
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
    background: radial-gradient(circle, rgba($accent-color ,0.8), rgba(255, 105, 180, 0) 100%);
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

  .count {
    position: absolute;
    bottom: 0;
    right: 0;
    font-size: 12px;

    text-shadow: 1px 1px black;
  }
</style>
