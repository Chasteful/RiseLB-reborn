<script lang="ts">
  export let max: number;
  export let value: number;
  export let color: string = "white";
  export let alignRight = false;
  export let label: string | null = null;
  export let icon: string | null = null;
  export let animateFrom: number | null = null;
  export let onDone: () => void = () => {};
  export let disableAutoColor: boolean = false;

  let showAnimation = false;
  let progress = Math.max(0, Math.min(value, max)); 
  let animOpacity = 1;
  let animProgress = Math.max(0, Math.min(value, max)); 

  function clamp(value: number): number {
    return Math.max(0, Math.min(value, max));
  }

  $: {
    if (animateFrom !== null) {
      const clampedFrom = clamp(animateFrom);
      const clampedTo = clamp(value);
      
      if (clampedFrom > clampedTo) {
        startAnimation(clampedFrom, clampedTo);
      } else {
      
        progress = clampedTo;
        animateFrom = null;
      }
    } else {
    
      progress = clamp(value);
    }
  }
  $: barColor =
  disableAutoColor
    ? color
    : progress / max < 0.2
      ? 'red'
      : progress / max < 0.4
        ? 'orange'
        : color;

  $: isEmpty = progress <= 0;
  $: isFull = progress >= max;
  function startAnimation(from: number, to: number) {
    showAnimation = true;
    animProgress = from;
    progress = to;
    const delta = from - to;
    const duration = 450;
    const start = Date.now();

    function tick() {
      const now = Date.now();
      const t = Math.min((now - start) / duration, 1);
      animProgress = from - delta * t;
      animOpacity = 1 - t;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        animateFrom = null;
        showAnimation = false;
        onDone();
      }
    }

    tick();
  }
  $: barShadow = isFull 
    ? `0 0 10px 2px ${color}, 0 0 5px, 0 0 5px inset, 100em 0 0 0 inset`
    : `0 0 5px, 0 0 5px inset, ${(progress / max) * 100}em 0 0 0 inset`;
</script>

<div 
  class="progress" 
  class:align-right={alignRight}
  class:empty={isEmpty} 
  class:full={isFull}   
>
  {#if label}
    <div class="label">{label}</div>
  {/if}
  {#if icon}
    <img class="icon" src="img/hud/hotbar/icon-{icon}.svg" alt={icon} />
  {/if}
  <div class="skew-wrapper">
    <div
    class="xgui-bar"
    style="
      box-shadow: {barShadow};
    color: {barColor};
      filter: {isFull ? 'brightness(1.1)' : 'none'};
    "
  ></div>
  </div>
  
  {#if showAnimation}
    <div class="skew-wrapper">
      <div
        class="xgui-bar anim-layer"
        style="
          box-shadow: 0 0 5px, 0 0 5px inset, {(animProgress / max) * 100}em 0 0 0 inset;
         color: {barColor};
          opacity: {animOpacity};
        "
      ></div>
    </div>
  {/if}
  
  <slot />
</div>

<style lang="scss">
  @use "../../../../colors.scss" as *;
  .skew-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: skew(30deg);
  transform-origin: left;
  overflow: hidden;
}
  .progress {
    position: relative;
    width: 200px;
    height: 20px;
    margin-bottom: 6px;

    border-radius: 5px;
    font-size: 2px;
    overflow: hidden;
     
    &.align-right {
      .icon {
        right: 5px;
        left: unset;
      }
      &.empty {
      border-color: transparent;
    }

    &.full {
      border-color: $hotbar-text-color; 
    }}

    .label {
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
      left: 6px;
      top: 50%;
      transform: translateY(-50%);
      z-index: 2;
      filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
    }

    .xgui-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  border-radius: 5px;
  transition: box-shadow 0.2s ease;
  z-index: 1;
}

    .anim-layer {
      pointer-events: none;
    }
  }
</style>