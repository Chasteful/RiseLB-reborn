<script lang="ts">
  import { toggleBackgroundShaderEnabled } from "../../../../integration/rest";
  import Account from "./Account.svelte";
  import Notifications from "./Notifications.svelte";
  import { onDestroy } from "svelte";
  import { currentLogo, logoVariants } from './logoStore';

  let glitchActive = false;
  let intervalId: ReturnType<typeof setInterval>;
  let timeoutId: ReturnType<typeof setTimeout>;
  let redLayer: HTMLImageElement;
  let blueLayer: HTMLImageElement;

  export let showAccount: boolean;

  function switchLogo() {
    currentLogo.update(n => (n % logoVariants) + 1);  
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

  function handleClick() {
    startGlitch();
    toggleBackgroundShaderEnabled(); 
  }


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