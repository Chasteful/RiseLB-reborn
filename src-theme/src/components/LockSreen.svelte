<script lang="ts">
    import {onDestroy, onMount, tick} from 'svelte';
    import { fade, fly, slide } from 'svelte/transition';
    import { createEventDispatcher } from 'svelte';
    import { currentLogo } from '../routes/menu/common/header/logoStore'
    import type { TransitionConfig } from 'svelte/transition'
    import { get } from 'svelte/store';
    import { locked,unlock } from '../routes/menu/common/locked_store';
    import {getShaderEnabled, setShaderEnabled} from "../integration/rest";
    enum UserStatus {
      LoggedOut = "Logged Out",
      LoggingIn = "Logging In",
      VerifyingLogIn = "Verifying Log In",
      LogInError = "Log In Error",
      LoggedIn = "Logged In"
    }
    
    let pinVisible: boolean[] = [false, false, false, false];

    const DEFAULT_PIN = "0721";

  function slideReverse(node: Element, options: any): TransitionConfig {
    return slide(node, { ...options, x: -100 }); 
  }
  let userStatus: UserStatus = get(locked) ? UserStatus.LoggedOut : UserStatus.LoggedIn;
    let pin = "";
    let hiddenInput: HTMLInputElement;
    let showError = false;
    let unsubscribe: () => void;
    const dispatch = createEventDispatcher();
  
    
    $: if ((userStatus === UserStatus.LoggingIn || userStatus === UserStatus.LogInError) && hiddenInput) {
      tick().then(() => hiddenInput.focus());
    }

    function formatTime(date: Date): string {
      const hours = date.getHours() % 12 || 12;
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    function handlePinChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const newValue = target.value.replace(/\D/g, '');
    const oldLength = pin.length;

    if (newValue.length <= 4) {
      pin = newValue;
      target.value = pin;

  
      if (newValue.length > oldLength) {
 
        const index = newValue.length - 1;
        pinVisible[index] = true;
        setTimeout(() => {
          pinVisible[index] = false;
        }, 500);
      } else if (newValue.length < oldLength) {
    
        for (let i = newValue.length; i < oldLength; i++) {
          pinVisible[i] = false;
        }
      }

      if (pin.length === 4) {
        verifyPin();
      }
    }
  }

  $: if ($locked) {

    userStatus = UserStatus.LoggedOut;
    pin = "";
    showError = false;
  }

  
    async function verifyPin() {
  userStatus = UserStatus.VerifyingLogIn;
  showError = false;

  await new Promise(r => setTimeout(r, Math.random() * 400 + 300));

  if (pin === DEFAULT_PIN) {
  userStatus = UserStatus.LoggedIn;
  unlock(); 
  dispatch('loginSuccess');
}
 else {
    userStatus = UserStatus.LogInError;
    showError = true;
    await tick();
    hiddenInput.focus();


    setTimeout(() => {
      if (userStatus === UserStatus.LogInError) {
        pin = "";
        hiddenInput.value = "";
        userStatus = UserStatus.LoggingIn;
        showError = false;
      }
    }, 1000);
  }
}

function startLogin() {
  userStatus = UserStatus.LoggingIn;
  pin = "";
  showError = false;
}

function cancelLogin() {
  userStatus = UserStatus.LoggedOut;
  locked.set(true); 
  pin = "";
  if (hiddenInput) hiddenInput.value = "";
  showError = false;
}




    function handleScreenClick() {
      if (userStatus === UserStatus.LoggedOut) {
        startLogin();
      }
    }
    onMount(async () => {
        unsubscribe?.();
        try {

            const lastModeIsFrag = await getShaderEnabled();
            currentLogo.set(lastModeIsFrag ? 2 : 1);
            await setShaderEnabled(lastModeIsFrag);
        } catch (e) {
            console.error("初始化背景模式失败:", e);
        }
    });
    onDestroy(() => {

        unsubscribe?.();

    });
    </script>


  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="lock-screen" on:click={handleScreenClick}>
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    {#if $currentLogo === 1}
    <div
    class="background-image"
    class:zoom-in={userStatus !== UserStatus.LoggedOut}
    style="background-image: url('background.png')" />
    {/if}
    {#if userStatus === UserStatus.LoggedOut}
      <div class="time" transition:slide>
        {formatTime(new Date())}
      </div>
  
      <div class="sign-in-button-wrapper" transition:fly={{ y: 50, duration: 200 }}>
        <!-- svelte-ignore a11y_consider_explicit_label -->
        <button class="sign-in-button" on:click|stopPropagation={startLogin}>
          <!-- svelte-ignore element_invalid_self_closing_tag -->
          <i class="fas fa-arrow-right-to-arc" />
        </button>
      </div>
    
      {:else if userStatus === UserStatus.LoggingIn || userStatus === UserStatus.LogInError}
      <div class="pin-wrapper" in:slide={{ duration: 300 }} out:slideReverse={{ duration: 300 }}>
        <input
          type="text"
          inputmode="numeric"
          bind:this={hiddenInput}
          on:input={handlePinChange}
          class="hidden-input"
          maxlength="4"
        />
        
        <div class="pin-digits">
            {#each [0, 1, 2, 3] as i}
            <div 
              class="pin-digit"
              class:focused={pin.length === i}
              class:hidden={!pinVisible[i] && pin[i] !== undefined}
              class:error={showError}
            >
              <span class="pin-digit-value">{pin[i] || ''}</span>
            </div>
          {/each}
          
        </div>
        
        <div class="pin-label">
          Enter YOUR PIN 
          {#if showError}
            <span class="pin-error">Invalid</span>
          {/if}
          <span class="pin-cancel" on:click|stopPropagation={cancelLogin}>Cancel</span>

        </div>
      </div>
    
    {:else if userStatus === UserStatus.VerifyingLogIn}
      <div class="loading-icon" transition:fade>
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <i class="fas fa-spinner-third fa-spin" />
      </div>
    {/if}
  </div>
  
  <style lang="scss">
    @function gray($color) {
      @return rgb($color, $color, $color);
    }
  
    $red: #f38ba8;
    $blue: #89dceb;

    .lock-screen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1;
      overflow: hidden;

    }
    .background-image {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-image: url('/background.png');
  background-size: cover;
  background-position: center;
  z-index: -1;
  filter: blur(8px);
  transform: scale(1);
  transition: transform 0.5s ease;
}

.background-image.zoom-in {
  transform: scale(1.2);
}

.time {
  position: absolute;
  bottom: 40px;
  left: 40px;
  color: gray(245);
  font-size: 4em;
  font-family: "Rubik", sans-serif;
  font-weight: 400;
  text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.1);
}

  
    .sign-in-button-wrapper {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      margin-bottom: 40px;
    }
  
    .sign-in-button {
      backdrop-filter: blur(3px);
      background-color: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 100px;
      padding: 10px;
      cursor: pointer;
      box-shadow: 2px 2px 2px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      
      &:hover {
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
      }
      
      i {
        color: gray(245);
        font-size: 1.25em;
      }
      
      &:not(:hover) {
        animation: bounce 3s infinite;
        animation-delay: 3s;
      }
    }
  

  
    .pin-wrapper {
      text-align: center;
      z-index: 2;
    }
  
    .pin-digits {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      justify-content: center;
    }
  
    .pin-digit {
      width: 60px;
      height: 80px;
      border-radius: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 3em;
      background-color: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      transition: all 0.3s ease;
      
      &.error {
        background-color: rgba($red, 0.05);
        border-color: rgba($red, 0.5);
        animation: shake 0.5s ease-in-out;
      }
    }
  
    .pin-digit.focused:before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 15%;
      width: 70%;
      height: 3px;
      background-color: gray(245);
      border-radius: 10px;
      animation: blink 2s ease-in-out infinite;
      transform: translateY(-10px);
    }
  
    .pin-digit.hidden:after {
      content: "";
      position: absolute;
      width: 20px;
      height: 20px;
      border-radius: 20px;
      background-color: gray(245);
    }
  
    .pin-digit-value {
      color: gray(245);
      transition: all 0.3s ease;
    }
  
    .pin-digit.hidden .pin-digit-value {
      opacity: 0;
      transform: scale(0.25);
    }
  
    .pin-label {
      color: gray(245);
      font-size: 0.9em;
      font-family: "Rubik", sans-serif;
      margin-top: 10px;
    }
  
    .pin-error {
      color: $red;
      margin-left: 5px;
    }
  
    .pin-cancel {
      cursor: pointer;
      margin-left: 5px;
      
      &:hover {
        text-decoration: underline;
      }
    }
  
    .hidden-input {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }
  
    .loading-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    transition: opacity 0.3s ease;
    
    i {
      color: white;
      font-size: 2em;
      animation: spin 1s linear infinite;
    }
  }

  // 添加状态类控制显示
  :global(.verifying-log-in) .loading-icon {
    opacity: 1;
  }

  :global(.log-in-error) .pin-digit {
    background-color: rgba($red, 0.05);
    border-color: rgba($red, 0.5);
  }



  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
    @keyframes blink {
      from, 25%, to { opacity: 1; }
      50% { opacity: 0; }
    }
  
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  
    @keyframes bounce {
      from, 6.66%, 17.66%, 33.33% {
        animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        transform: translate3d(0, 0, 0);
      }
      13.33%, 14.33% {
        animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
        transform: translate3d(0, -30px, 0) scaleY(1.1);
      }
      23.33% {
        animation-timing-function: cubic-bezier(0.755, 0.05, 0.855, 0.06);
        transform: translate3d(0, -15px, 0) scaleY(1.05);
      }
      26.66% {
        transition-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        transform: translate3d(0, 0, 0) scaleY(0.95);
      }
      30% {
        transform: translate3d(0, -4px, 0) scaleY(1.02);
      }
    }
  
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-5px); }
      40%, 80% { transform: translateX(5px); }
    }
  </style>
