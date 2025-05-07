<script lang="ts">
  import { toggleBackgroundShaderEnabled,getShaderEnabled } from "../../../../integration/rest";
  import Account from "./Account.svelte";
  import Notifications from "./Notifications.svelte";
  import { onDestroy, onMount } from "svelte";
  import { currentLogo, logoVariants } from './logoStore';
  import { lock } from "../../common/locked_store"; 
  export let showAccount: boolean;
  let glitchActive = false;
  let intervalId: ReturnType<typeof setInterval>;
  let timeoutId: ReturnType<typeof setTimeout>;
  let redLayer: HTMLImageElement;
  let blueLayer: HTMLImageElement; 
  let pressTimer: NodeJS.Timeout;
  let shaderEnabled: boolean = false;
 
  const LONG_PRESS_DURATION = 1000;
  function updateShaderStatusBasedOnLogo() {
    currentLogo.subscribe(current => {
      shaderEnabled = current === 1; // 当 currentLogo 为 1 时启用 shader，否则禁用
    });
  }
  function switchLogo() {
    currentLogo.update(n => {
      const newLogo = (n % logoVariants) + 1;
      return newLogo;
    });
  }
    

  function handleLogoMouseDown() {
    pressTimer = setTimeout(() => {
      lock();
    }, LONG_PRESS_DURATION);
  }
  
  function handleLogoMouseUp() {
    clearTimeout(pressTimer);
  }
  function startGlitch() {
    clearInterval(intervalId);
    clearTimeout(timeoutId);
    glitchActive = true;
    const layers = [redLayer, blueLayer].filter(Boolean) as HTMLImageElement[];
    intervalId = setInterval(() => {
      layers.forEach((layer) => {
        const tx = Math.random() * 20 - 10;
        const ty = Math.random() * 20 - 10;
        layer.style.transform = `translate(${tx}px, ${ty}px)`;

        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const w = Math.random() * 20 + 20;
        const h = Math.random() * 20 + 20;
        layer.style.clipPath = `polygon(${x}% ${y}%, ${x + w}% ${y}%, ${x + w}% ${y + h}%, ${x}% ${y + h}%)`;
      });
    }, 30);

    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      layers.forEach((layer) => {
        layer.style.transform = '';
        layer.style.clipPath = '';
      });
      glitchActive = false;
    }, 1000);
  }
  async function handleClick() {
    startGlitch();
    try {
      await toggleBackgroundShaderEnabled();
      shaderEnabled = !shaderEnabled; 
    } catch (e) {
      console.error("Failed to toggle shader", e);
    }
  }



  onMount(async () => {
    updateShaderStatusBasedOnLogo(); 
    try {
      shaderEnabled = await getShaderEnabled();
    } catch (e) {
      console.error("Failed to fetch shader status", e);
    }
  });

  onDestroy(() => {
    clearInterval(intervalId);
    clearTimeout(timeoutId);
  });
</script>


  <div class="header">
    <button 
      class="logo-container reset-button" 
      on:click={handleClick}
      on:click|preventDefault={switchLogo}
      on:contextmenu|preventDefault={switchLogo}
      on:mousedown={handleLogoMouseDown}
      on:mouseup={handleLogoMouseUp}
      on:mouseleave={handleLogoMouseUp}
      on:touchstart={handleLogoMouseDown}
      on:touchend={handleLogoMouseUp}
    >
      <img class="logo {glitchActive ? 'transparent' : ''}"      
        src="img/lb-logo{$currentLogo}.svg"  alt="logo" 
        draggable="false"/>
    <img bind:this={redLayer} 
    class="logo glitch-layer red 
    {glitchActive ? 'visible' : ''}"      
     src="img/lb-logo{$currentLogo}.svg" 
     alt="logo" />
    <img bind:this={blueLayer} 
    class="logo glitch-layer blue 
    {glitchActive ? 'visible' : ''}"     
      src="img/lb-logo{$currentLogo}.svg"  alt="logo" 
      />
    </button>
  <Notifications />

  {#if showAccount}
    <Account />
  {/if}
</div>

<style lang="scss">
@import "../../../../colors";

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 60px;
}

.logo-container {
  position: relative;
  cursor: pointer;
}

.logo {
  height: 125px;
  user-select: none;
  display: block;
  transition: opacity 0.2s ease;
}

.logo.transparent {
  opacity: 0; 

}
.glitch-layer {
position: absolute;
top: 0;
left: 0;
height: 125px;
pointer-events: none;
mix-blend-mode: lighten;
opacity: 0;
pointer-events: none;
transition: opacity 0.1s ease;
}
.glitch-layer.visible {
opacity: 1;
}
.glitch-layer.red {
  filter: drop-shadow(-2px 0 0 $accent-color);
}

.glitch-layer.blue {
  filter: drop-shadow(2px 0 0 $accent-color-2);
}
</style>