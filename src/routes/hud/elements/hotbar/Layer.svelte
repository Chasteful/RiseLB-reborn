<script lang="ts">
    export let from: number;
    export let to: number;
    export let max: number;
    export let color: string;
    export let alignRight = false;
    export let duration = 450;
    export let onDone = () => {};
  
    let progress = from;
    let opacity = 1;
    const delta = from - to;
    const start = Date.now();
    const tick = () => {
      const now = Date.now();
      const t = Math.min((now - start) / duration, 1);
      progress = from - delta * t;
      opacity = 1 - t;
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        onDone();
      }
    };
    tick();
  
  </script>
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div
    class="layer"
    class:align-right={alignRight}
    style="width: 320px; background-color: {color}; opacity: {opacity};"
  />
  <style>
    
    .layer {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      transition: width 0.2s ease;
      border-radius: 5px;
      pointer-events: none;
    }
    .align-right {
      right: 0;
      left: unset;
    }
  </style>