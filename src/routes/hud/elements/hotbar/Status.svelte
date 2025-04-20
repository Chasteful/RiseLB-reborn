<script lang="ts">
  export let max: number;
  export let value: number;
  export let color: string;
  export let alignRight: boolean;
  export let label: string | null = null;
  export let icon: string | null = null;
  export let prevValue: number | null = null; // 传入上一次的值
  export let enableAnimation: boolean = false; // 是否启用动画
  // svelte-ignore export_let_unused
export let onDone: (() => void) | undefined;

  let showAnimation = false;

  $: {
    if (enableAnimation && prevValue !== null && prevValue > value) {
      showAnimation = true;
    }
  }
</script>
<div class="progress" class:align-right={alignRight}>
  {#if label}
    <div class="label">{label}</div>
  {/if}
  {#if icon}
    <img class="icon" src="img/hud/hotbar/icon-{icon}.svg" alt={icon}>
  {/if}

  <!-- 当前进度条 -->
  <div
    class="progress-bar current-layer"
    style="width: {(value / max) * 100}%; background-color: {color};"
  ></div>

  <!-- 关键：Layer 插槽放进来 -->
  <slot></slot>
</div>
<style lang="scss">
@use "../../../../colors.scss" as *;

.label {
  color: $hotbar-text-color;
  position: absolute;
  font-size: 14px;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  text-shadow: $hotbar-text-color 0px 0px 4px;
}

.icon {
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2; 
}

.progress {
  position: relative;
  border-radius: 5px;
  box-shadow: 0 0 2px 2px rgba(0, 0, 0, 0.4);
  background-color: rgba($hotbar-base-color, 0.68);
  height: 20px; 
  margin-bottom: 6px; 

  .icon {
    right: 5px;
    left: unset;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.4));
  }

  .progress-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%; 
    border-radius: 5px;
    will-change: width;
    transition: ease width 0.2s;
    z-index: 1; 
  }
}
.align-right {
    right: 0;
    left: unset;
  }
.progress-bar.damage-layer {
  animation: statusShrink 0.8s cubic-bezier(0.4, 0, 0.6, 1) forwards;
}


@keyframes statusShrink {
  0% {
    width: calc(var(--value) / var(--max) * 100%);
  }
  100% {
    width: calc(var(--target) / var(--max) * 100%);
  }
}
</style>