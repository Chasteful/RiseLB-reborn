<script lang="ts">
  import { description, type TDescription } from "./clickgui_store";
  import { onMount, onDestroy } from "svelte";
  import { cubicOut, quintOut } from "svelte/easing";
  import { tweened } from "svelte/motion";
    import { fade, fly } from "svelte/transition";

  let data: TDescription | null = null;
  let visibleText = '';
  let timer: ReturnType<typeof setInterval> | null = null;
  let mouseX = 0;
  let mouseY = 0;
  
  // 动画控制
  const opacity = tweened(0, { duration: 200, easing: quintOut });
  const scale = tweened(0.9, { duration: 200, easing: quintOut });
  const slide = tweened(-10, { duration: 200, easing: quintOut });

  description.subscribe((v) => {
    if (v) {
      // 显示动画
      data = v;
      opacity.set(1);
      scale.set(1);
      slide.set(0);
      startRevealText(v.description);
    } else if (data) { // 只在有数据时才执行消失动画
      // 隐藏动画
      opacity.set(0);
      scale.set(0.9);
      slide.set(-10);
      startHideText().then(() => {
        data = null; // 动画完成后再清空数据
      });
    }
  });

  function updateMouse(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }

  function startRevealText(text: string) {
    if (timer) clearInterval(timer);
    visibleText = '';
    let i = 0;
    timer = setInterval(() => {
      if (i < text.length) {
        visibleText += text.charAt(i);
        i++;
      } else {
        clearInterval(timer!);
      }
    }, 15);
  }

  function startHideText(): Promise<void> {
    return new Promise(resolve => {
      if (timer) clearInterval(timer);
      let i = visibleText.length;
      timer = setInterval(() => {
        if (i > 0) {
          visibleText = visibleText.slice(0, i - 1);
          i--;
        } else {
          clearInterval(timer!);
          resolve();
        }
      }, 15);
    });
  }

  onMount(() => {
    window.addEventListener("mousemove", updateMouse);
  });

  onDestroy(() => {
    window.removeEventListener("mousemove", updateMouse);
    if (timer) clearInterval(timer);
  });
</script>

{#if data}
  <div
    class="description-wrapper"
    style="top: {mouseY + 20}px; left: {mouseX + 10}px;"

    out:fade={{ duration: 300, easing: cubicOut }}>
    <div 
      class="description"
      style="opacity: {$opacity}; transform: scale({$scale}) translateX({$slide}px);"
    >
      <div class="text">{visibleText}</div>
    </div>
  </div>
{/if}

<style lang="scss">
  @import "../../colors.scss";
  .description-wrapper {
    position: fixed;
    z-index: 9999999;
    pointer-events: none;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    transform: scale(0.6);
    transform-origin: top left;
  }

  .description {
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    background-color: rgba(30, 30, 30, 0.3);
    border-radius: 10px;
    padding: 6px 10px;
    font-size: 14px;
    color: white;
    box-shadow: 
      0 0 8px rgba($accent-color, 0.4), 
      inset 0 0 6px rgba($accent-color-2, 0.2);
    max-width: 300px;
    will-change: transform, opacity;
    transform-origin: top left;
  }

  .text {
    contain: content;
  }
</style>