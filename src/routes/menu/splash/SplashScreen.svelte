<script lang="ts">
  import { expoInOut, quintOut } from "svelte/easing";
  import { scale, fade, fly } from "svelte/transition";
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher();
  let showLoader = false;

  onMount(() => {
    setTimeout(() => {
      showLoader = true;
    }, 100);

    setTimeout(() => {
      dispatch('finish'); 
    }, 4200); 
  });
</script>

<style lang="scss">
  @use "../././../../colors.scss" as *;

  @keyframes loading-bar-progress {
    0% {
      width: 0;
    }
    100% {
      width: 100%;
    }
  }

  .wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    margin: 0;
    background-color: transparent;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bg-pattern {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #1C1B22;
  }

  .loader-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }


  .loading-bar {
    position: relative;
    width: 500px;
    height: 62.5px;
    user-select: none;
    overflow: hidden;
    
   
    &-bg {
      position: absolute;
      width: 100%;
      height: 100%;
      background-color: #434343; 
      mask: url("https://yuanshen.site/imgs/loading-bar.png") no-repeat left 100%;
      mask-size: 500px 62.5px;
    }


    &-progress {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0;
      background-color: #ece5d8; 
      mask: url("https://yuanshen.site/imgs/loading-bar.png") no-repeat left 100%;
      mask-size: 500px 62.5px;
      animation: loading-bar-progress 3.5s ease-out forwards;
    }
  }
</style>

<div class="wrapper" out:fade={{ duration: 400 }}>
  <div class="bg-pattern" 
       in:fade={{ duration: 1200, easing: expoInOut, delay: 200 }} 
       out:fade={{ duration: 600, easing: expoInOut }} />
  
  {#if showLoader}
    <div class="loader-wrapper" 
         in:fly={{ y: 20, duration: 800, easing: quintOut, delay: 200 }}
         out:scale={{ duration: 600, easing: expoInOut }}>
         <div class="loading-bar" role="presentation" aria-hidden="true">
          <div class="loading-bar-bg"></div> 
          <div class="loading-bar-progress"></div> 
        </div>
    </div>
  {/if}
</div>