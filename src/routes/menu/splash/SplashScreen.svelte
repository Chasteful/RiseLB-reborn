<script lang="ts">
  import { expoInOut, quintOut } from "svelte/easing";
  import { scale, fade, fly } from "svelte/transition";
  import { onMount } from "svelte";

  let showLoader = false;
  
  onMount(() => {
  
    setTimeout(() => showLoader = true, 100);
  });
</script>

<div class="wrapper" 
     in:fly={{ y: -50, duration: 800, easing: quintOut }}
     out:fade={{ duration: 400 }}>
  
  <!-- svelte-ignore element_invalid_self_closing_tag -->
  <div class="bg-pattern" 
       in:scale={{ duration: 1200, easing: expoInOut, delay: 200 }} 
       out:scale={{ duration: 600, easing: expoInOut }} />
  
  {#if showLoader}
    <div class="loader-wrapper" 
         in:fly={{ y: 20, duration: 800, easing: quintOut, delay: 200 }}
         out:scale={{ duration: 600, easing: expoInOut }}>
      <div class="lds-ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
      <div class="loading-text" in:fade={{ delay: 600 }}>Loading...</div>
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../././../../colors.scss" as *;

  .wrapper {
    position: relative;
    width: 100vw;
    height: 100vh;
    margin: 0;
    overflow: hidden;
    background-color: $base;
  }

  .bg-pattern {
  background: 
    radial-gradient(circle at center, transparent 0%, $base 70%),
    linear-gradient(to right, $mauve, $blue);
  animation: bgPulse 8s ease infinite;
}

@keyframes bgPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

  .loader-wrapper {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .loading-text {
    color: $text;
    font-size: 1rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 2px;
    animation: pulse 2s ease-in-out infinite;
  }

  .lds-ring,
  .lds-ring div {
    box-sizing: border-box;
    position: relative;
    color: $mauve;
  }
  
  .lds-ring {
    display: inline-block;
    width: 64px;
    height: 64px;
    filter: drop-shadow(0 0 8px rgba($mauve, 0.4));
  }
  
  .lds-ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 48px;
    height: 48px;
    margin: 8px;
    border: 4px solid currentColor;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: currentColor transparent transparent transparent;
  }
  
  .lds-ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  
  .lds-ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  
  .lds-ring div:nth-child(3) {
    animation-delay: -0.15s;
  }

  @keyframes lds-ring {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }


  @keyframes pulse {
    0%, 100% {
      opacity: 0.8;
      transform: scale(0.98);
    }
    50% {
      opacity: 1;
      transform: scale(1.02);
    }
  }
</style>