<script lang="ts">
  import Layer from "./Layer.svelte";
  export let max: number;
  export let value: number;
  export let color: string;
  export let alignRight = false;
  export let label: string | null = null;
  export let icon: string | null = null;
  export let animateFrom: number | null = null;
  export let onDone: () => void = () => {};

  $: showAnimation = animateFrom !== null && animateFrom > value;

</script>
<div class="progress" class:align-right={alignRight}>
  {#if label}
    <div class="label">{label}</div>
  {/if}
  {#if icon}
    <img class="icon" src="img/hud/hotbar/icon-{icon}.svg" alt={icon}>
  {/if}
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div
    class="current-value"
    style="width: {(value / max) * 100}%; background-color: {color};"
  />
  {#if showAnimation}
    <Layer
      from={animateFrom!}
      to={value}
      max={max}
      color={color}
      alignRight={alignRight}
      onDone={() => {
        animateFrom = null;
        onDone();
      }}
    />
  {/if}
  <slot />
</div>

<style lang="scss">
  @use "../../../../colors.scss" as *;
  .progress {
    position: relative;
    border-radius: 5px;
    box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.4);
    background-color: rgba($hotbar-base-color, 0.68);
    height: 20px;
    margin-bottom: 6px;
    .label {
      color: $hotbar-text-color;
      position: absolute;
      font-size: 14px;
      right: 5px;
      top: 50%;
      transform: translateY(-50%);
      text-shadow: $hotbar-text-color 0px 0px 4px;
      z-index: 2;
    }
    .icon {
      position: absolute;
      left: 5px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
    }
    .current-value {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: 5px;
      will-change: width;
      transition: ease width 0.2s;
      z-index: 1;
    }
    &.align-right {
      .icon {
        right: 5px;
        left: unset;
      }
      .current-value {
        right: 0;
        left: unset;
      }
    }
  }
</style>