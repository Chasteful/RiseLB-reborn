<script lang="ts">
    import { onMount } from "svelte";
    import { writable } from "svelte/store";
  
    export let baseResolution = { width: 1920, height: 1080 };
    export let manualZoom = 1;
  
    const scale = writable(1);
  
    function calculateBaseScale() {
      const widthRatio = (window.innerWidth / baseResolution.width) * (window.innerWidth / screen.availWidth);
      const heightRatio = (window.innerHeight / baseResolution.height) * (window.innerHeight / screen.availHeight);
      return Math.min(widthRatio, heightRatio);
    }
  
    onMount(() => {
      const updateScale = () => scale.set(calculateBaseScale());
      window.addEventListener("resize", updateScale);
      updateScale();
  
      return () => {
        window.removeEventListener("resize", updateScale);
      };
    });
  </script>
  
  <div class="autoscaler" style="transform: scale({$scale * manualZoom}); transform-origin: 0 0;">
    <slot />
  </div>
  
  <style lang="scss">
    .autoscaler {
      position: fixed;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1080px;
      will-change: transform;
      pointer-events: none;
    }
  </style>
  