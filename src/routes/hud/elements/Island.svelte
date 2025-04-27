<script lang="ts">
  import { getClientInfo, getSession } from "../../../integration/rest";
  import { onMount } from "svelte";
  import { listen } from "../../../integration/ws";
  import { getModules } from "../../../integration/rest";
  import { getPlayerData } from "../../../integration/rest";
  import type { ClientInfo, Session } from "../../../integration/types";
  import type { ClientPlayerDataEvent } from "../../../integration/events";
  import type { PlayerData } from "../../../integration/types";
  import { fade } from "svelte/transition"; 


  type AlertType = 'health' | 'air' | 'hunger' | 'saturation' | null;
  let alertState: 'hidden' | 'showing' | 'hiding' = 'hidden';
  let clientInfo: ClientInfo | null = null;
  let session: Session | null = null;
  let time: string;
  let playerData: PlayerData | null = null;
  let showUsername = false;
  let clientName = "RiseLB"
  let clientVersion = "1.6.0"
  let currentAlert: {
    type: AlertType;
    title: string;
    message: string;
  } | null = null;
  
  let lastHealthValue = 20;
  let lastAirValue = 300;
  let lastFoodValue = 20;
  


  async function canShowUsername() {
    const modules = await getModules();
    return modules.some(module => module.name === "NameProtect" && !module.enabled);
  }

  async function updateClientInfo() {
    clientInfo = await getClientInfo();
  }

  async function updateSession() {
    session = await getSession();
  }
 
  function showAlert(type: AlertType, title: string, message: string) {
    
    if (currentAlert) {
      alertState = 'hiding';
      setTimeout(() => {
        currentAlert = { type, title, message };
        alertState = 'showing';
      }, 300); 
    } else {
      currentAlert = { type, title, message };
      alertState = 'showing';
    }

    
    setTimeout(() => {
      if (alertState === 'showing') {
        alertState = 'hiding';
        setTimeout(() => {
          currentAlert = null;
          alertState = 'hidden';
        }, 300);
      }
    }, 3000);
  }
  function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // 英文问候语
    let greeting = "Good night";
    if (hours >= 5 && hours < 12) greeting = "Good morning";
    else if (hours >= 12 && hours < 18) greeting = "Good afternoon";
    else if (hours >= 18 && hours < 22) greeting = "Good evening";
    
    time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    timeGreeting = greeting;
  }

  let timeGreeting = "";
  
 
  async function updatePlayerData() {
    const newData = await getPlayerData();
    if (!newData) return;
    
    
    if (newData.actualHealth !== lastHealthValue) {
      if (newData.actualHealth <= 5 && lastHealthValue > 5) {
        showAlert('health', 'LowHealth', `Your health is severely inadequate!`);
      }
      lastHealthValue = newData.actualHealth;
    }
    
    
    if (newData.air !== lastAirValue) {
      if (newData.air <= 25 && lastAirValue > 25) {
        showAlert('air', 'Low Air', `Please emerge as soon as possible!`);
      }
      lastAirValue = newData.air;
    }
    
    if (newData.food !== lastFoodValue) {
  
  if (newData.food < 20 && lastFoodValue === 20) {
    showAlert('hunger', 'Cannot Heal',`Stop combat/food recovery shortly(${newData.food}/20)`);
  } 
  
  else if (newData.food <= 7 && lastFoodValue > 7) {
    showAlert('saturation', 'LowSaturation',   `Your saturation is critically low(${newData.food}/20)`);
  }
  lastFoodValue = newData.food;
}

    playerData = newData;
  }

  onMount(async () => {
    updateClientInfo();
    updateTime();
    updateSession();
    showUsername = await canShowUsername();
    updatePlayerData();
    
    setInterval(async () => {
      updateClientInfo();
      updateTime();
      updateSession();
      showUsername = await canShowUsername();
      updatePlayerData();
    }, 1000);
  });

  listen("session", async () => {
    await updateSession();
  });
  
  listen("playerData", (event: ClientPlayerDataEvent) => {
    playerData = event.playerData;
    updatePlayerData();
  });
</script>

  <div class="dynamic-island-container">
    <div class="dynamic-island {alertState}" class:expanded={currentAlert !== null}>
      <div class="content-wrapper">
        {#if currentAlert}
          <!-- 通知状态 -->
          <div class="notification-content {currentAlert.type}"
          in:fade={{ duration: 150 }}
          >
            <div class="icon">
              <img src="img/hud/island.svg" alt="icon" />
            </div>
            <div class="text">
              <div class="title">{currentAlert.title}</div>
              <div class="description">{currentAlert.message}</div>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar {currentAlert.type}"></div>
            </div>
          </div>
        {:else}
          <!-- 常态水印 -->
          <div class="watermark-content"
          in:fade={{ duration: 20 }}
          out:fade={{ duration: 200 }}>

            <span class="client gradient-text">{clientName}&nbsp{clientVersion}</span>
            <div class="separator"></div>
            {#if session && showUsername}
              <span class="greeting gradient-text">{timeGreeting}，{session.username}</span>
            {:else}
              <span class="greeting gradient-text">{timeGreeting}</span>
            {/if}
            <div class="separator"></div>
            <span class="time gradient-text">{time}</span>
          </div>
        {/if}
      </div>
    </div>
  </div>
  <style lang="scss">
  @import "../../../colors.scss";
  @mixin text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
  .dynamic-island-container {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    filter: 
      drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))
      drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2))
      drop-shadow(0 16px 48px rgba(0, 0, 0, 0.15));
    perspective: 1000px;
  }
  
  .dynamic-island {
    --base-width: 120px;  
    --expanded-width: 280px;
    --height: 40px;
    --expanded-height: 60px;
    --radius: 999px;
    
    background: rgba(20, 20, 20, 0.5);
    backdrop-filter: blur(12px) brightness(1.1);
    color: rgba($text, 0.9);
    border-radius: var(--radius);
    height: var(--height);
    padding: 0 16px;
    min-width: 120px;
    max-width: 400px;
    display: flex;
    align-items: center;
    transition: 
      width 0.4s cubic-bezier(0.25, 1, 0.5, 1),
      height 0.4s cubic-bezier(0.25, 1, 0.5, 1),
      border-radius 0.3s 0.1s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.3s ease,
      box-shadow 0.3s ease;
    transform-style: preserve-3d;
    box-shadow: 
      0 4 16px rgba(0, 0, 0, 0.6),
      inset 0 0 10px rgba(255, 255, 255, 0.05);
  

  
    &.expanded {
      height: var(--expanded-height);
      border-radius: 16px;
      padding: 0 20px;
      box-shadow: 
        0 0 20px rgba(255, 255, 255, 0.15),
        inset 0 0 15px rgba(255, 255, 255, 0.1);
    }
  
    &.showing {
      animation: 
        expand 0.4s cubic-bezier(0.25, 1, 0.5, 1),
        pulse 2s infinite alternate;
    }
  
    &.hiding {
      animation: 
        collapse 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
  }
  
  .content-wrapper {
    width: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
    position: relative;
  }
  
  .watermark-content {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    font-size: 14px;
    white-space: nowrap;
  
    .client, .greeting, .time{
      font-weight: 600;
      letter-spacing: -0.25px;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      animation: gradientFlow 6s linear infinite;
      background-size: 200% 200%;
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }
  
    .client {
      background-image: linear-gradient(90deg,  $text, $accent-color,$text);
    }
    .greeting{
      background-image: linear-gradient(90deg, #ffffff, #ffffffb2, #ffffff);
    }
  
    .time {
      background-image: linear-gradient(90deg, #ffffff, #ffffffb2, #ffffff);
    }
  
    .separator {
      width: 1px;
      height: 14px;
      background: linear-gradient(to bottom, transparent, rgba($text, 0.5), transparent);
      animation: separatorPulse 2s infinite;
    }
  }
  
  .notification-content {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 4px 0;
    position: relative;
    
    .icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;

    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
  
      filter: 
        brightness(0) saturate(100%) invert(100%)
        drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
    }
  }

  &.health .icon img {
    filter: 
      brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(340deg)
      drop-shadow(0 0 5px rgba(255, 50, 50, 0.7));
  }

  &.air .icon img {
    filter: 
      brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(180deg)
      drop-shadow(0 0 5px rgba(50, 150, 255, 0.7));
  }

  &.hunger .icon img {
    filter: 
      brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(30deg)
      drop-shadow(0 0 5px rgba(255, 180, 50, 0.7));
  }

  &.saturation .icon img {
    filter: 
      brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(10deg)
      drop-shadow(0 0 5px rgba(255, 100, 50, 0.7));
  }


  
    .progress-bar-container {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 0 0 16px 16px;
      overflow: hidden;
      
      .progress-bar {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        transform-origin: left center;
        animation: progress 3s linear forwards;
        box-shadow: 0 0 10px currentColor;
        
        &.health { background: linear-gradient(90deg, #ff453a, #ff8a80); }
        &.air { background: linear-gradient(90deg, #2e90bd, #7fd1ff); }
        &.hunger { background: linear-gradient(90deg, #ff9f0a, #ffd60a); }
        &.saturation { background: linear-gradient(90deg, #ff640a, #ffab5e); }
      }
    }
  
 
  
    .text {
      flex: 1;
      min-width: 0;
      
      .title {
        font-weight: 700;
        font-size: 14px;
        line-height: 1.2;
        @include text-ellipsis;
        text-shadow: 0 0 5px currentColor;
        animation: textGlow 2s infinite alternate;
      }
      
      .description {
        font-size: 12px;
        color: rgba($text, 0.9);
        @include text-ellipsis;
        margin-top: 2px;
        text-shadow: 0 0 3px rgba(255, 255, 255, 0.5);
      }
    }
  
    &.health { 
      .title { 
        color: #ff453a;
        background: linear-gradient(90deg, #ff453a, #ff8a80);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
    &.air { 
      .title { 
        color: #2e90bd;
        background: linear-gradient(90deg, #2e90bd, #7fd1ff);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
    &.hunger { 
      .title { 
        color: #ff9f0a;
        background: linear-gradient(90deg, #ff9f0a, #ffd60a);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
    &.saturation { 
      .title { 
        color: #ff640a;
        background: linear-gradient(90deg, #ff640a, #ffab5e);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
      }
    }
  }
  
 
  @keyframes progress {
    from { transform: scaleX(1); }
    to { transform: scaleX(0); }
  }
  
  @keyframes expand {
    from {
      width: var(--base-width);
      height: var(--height);
      border-radius: var(--radius);
    }
    to {
      width: var(--expanded-width);
      height: var(--expanded-height);
      border-radius: 16px;
    }
  }
  
  @keyframes collapse {
    from {
      width: var(--expanded-width);
      height: var(--expanded-height);
      border-radius: 16px;
    }
    to {
      width: var(--base-width);
      height: var(--height);
      border-radius: var(--radius);
    }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); box-shadow: 0 0 10px rgba(255, 255, 255, 0.2); }
    100% { transform: scale(1.02); box-shadow: 0 0 20px rgba(255, 255, 255, 0.4); }
  }
  
  @keyframes glowPulse {
    0% { opacity: 0.5; }
    100% { opacity: 0.9; }
  }
  
  @keyframes gradientFlow {
    0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 200% 200%; 
  }

  }
  

  
  @keyframes separatorPulse {
    0%, 100% { opacity: 0.7; height: 14px; }
    50% { opacity: 1; height: 16px; }
  }
  
  @keyframes textGlow {
    0% { text-shadow: 0 0 5px currentColor; }
    100% { text-shadow: 0 0 10px currentColor; }
  }
  </style>