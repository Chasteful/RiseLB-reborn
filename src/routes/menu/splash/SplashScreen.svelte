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



  @keyframes loading-bar {
    0% {
      width: 0;
      background-size: 500px 62.5px;
    }
    100% {
      width: 500px;
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

    &::after {
      content: "";
      position: absolute;
      top: 500px;
      left: 0;
      filter: drop-shadow(0 -500px 0 #ece5d8);
      width: 500px;
      height: 62.5px;
      background: url("https://yuanshen.site/imgs/loading-bar.png") no-repeat left 100%;
      background-size: 500px 62.5px;
      background-position-x: 0;
      animation: loading-bar 3.5s ease-out infinite forwards;
    }
  }
</style>

<div class="wrapper" 
     out:fade={{ duration: 400 }}>
  
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div class="bg-pattern" 
       in:fade={{ duration: 1200, easing: expoInOut, delay: 200 }} 
       out:fade={{ duration: 600, easing: expoInOut }} />
  
  {#if showLoader}
    <div class="loader-wrapper" 
         in:fly={{ y: 20, duration: 800, easing: quintOut, delay: 200 }}
         out:scale={{ duration: 600, easing: expoInOut }}>
      <div class="loading-bar" role="presentation" aria-hidden="true">
        <!-- Using a data attribute instead of longdesc -->
 
      </div>
    </div>
  {/if}
</div>