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
    time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
 
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
    showAlert('saturation', 'Cannot Heal', `Your saturation is critically low(${newData.food}/20)`);
  } 
  
  else if (newData.food <= 7 && lastFoodValue > 7) {
    showAlert('hunger', 'LowSaturation',   `Stop sprint/food recovery shortly(${newData.food}/20)`);
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
          <!-- Add progress bar here -->
          <div class="progress-bar-container">
            <div class="progress-bar {currentAlert.type}"></div>
          </div>
        </div>
      {:else}
        <!-- 常态水印 -->
        <div class="watermark-content"
        in:fade={{ duration: 20 }}
        out:fade={{ duration: 200 }}>
          <span class="client">RiseLB 1.5.7</span>
          <div class="separator"></div>
          {#if session && showUsername}
            <span class="username">{session.username}</span>
          {/if}
          <div class="separator"></div>
          <span class="time">{time}</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
@import "../../../colors.scss";

.dynamic-island-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.dynamic-island {
  --base-width: 120px;  
  --expanded-width: 280px;
  --height: 40px;
  --expanded-height: 60px;
  --radius: 999px;
  
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(8px);
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
    border-radius 0.3s 0.1s cubic-bezier(0.4, 0, 0.2, 1);

  &.expanded {
    height: var(--expanded-height);
    border-radius: 16px;
    padding: 0 20px;
  }

  
  &.showing {
    animation: 
   
      expand 0.4s cubic-bezier(0.25, 1, 0.5, 1);
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
}


.watermark-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 14px;
  white-space: nowrap;

  .client {
    font-weight: 600;
    letter-spacing: -0.25px;
  }

  .separator {
    width: 1px;
    height: 14px;
    background: rgba($text, 0.25);
  }

  .username, .time {
    opacity: 0.9;
    font-weight: 500;
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
    filter: brightness(0) saturate(100%) invert(100%);
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  .progress-bar-container {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 3px;
    background: rgba(0, 0, 0, 0.2);
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
      
      &.health { background: #ff453a; }
      &.air { background: #2e90bd; }
      &.hunger { background: #ff9f0a; }
      &.saturation { background: #ff640a; }
    }
  }
  @keyframes progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
  @mixin text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
  .text {
    flex: 1;
    min-width: 0;
    
    .title {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.2;
      color: $text;
      @include text-ellipsis;
    }
    
    .description {
      font-size: 12px;
      color: rgba($text, 0.85);
      @include text-ellipsis;
      margin-top: 2px;
    }
  }


  &.health { border-color: #ff453a; .title { color: #ff453a; } }
  &.air { border-color: #2e90bd; .title { color: #2e90bd; } }
  &.hunger { border-color: #ff9f0a; .title { color: #ff9f0a; } }
  &.saturation{ border-color: #ff640a; .title { color: #ff640a; } }
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


</style>