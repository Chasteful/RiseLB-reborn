<script lang="ts">
import { onMount, tick } from "svelte";
import { fade } from "svelte/transition";
import { 
  getClientInfo, 
  getSession, 
  getModules, 
  getPlayerData 
} from "../../../integration/rest";
import type { ClientPlayerDataEvent } from "../../../integration/events";
import { listen } from "../../../integration/ws";
import type { 
  ClientInfo, 
  Session, 
  PlayerData,
} from "../../../integration/types";
import { tweened } from "svelte/motion";
import { cubicOut } from "svelte/easing";
import { blockCount,armorValue, armorThreshold,DURABILITY_RECOVERY,
  armorDurabilityStore, emptySlotCount,DURABILITY_THRESHOLD } from './Island';
import { get } from 'svelte/store';

const INVENTORY_FULL_COOLDOWN_MS = 30000; 
const CLIENT_NAME = "RiseLB";
const CLIENT_VERSION = "1.6.1";
const UPDATE_INTERVAL_MS = 50;
const ALERT_DISPLAY_DURATION_MS = 2500;
const ARMOR_ALERT_DURABILITY_COOLDOWN_MS = 15000;
const ANIMATION_DURATION_MS = 300;
const DURABILITY_COOLDOWN_MS = 1000;
type AlertType =
    'health' | 'air' | 'blocks' | 'hunger' | 
    'saturation' | 'armor' | 'durability' | 'inventory' | null;
type AlertState = 'hidden' | 'showing' | 'hiding';
type ContentType = 'alert' | 'greeting' | 'status';

interface Alert {
  type: AlertType;
  title: string;
  message: string;


}
const warnedSlots = new Map<string, number>();
let alertState: AlertState = 'hidden';
let clientInfo: ClientInfo | null = null;
let session: Session | null = null;
let playerData: PlayerData | null = null;
let showUsername = false;
let currentAlert: Alert | null = null;
let lastEmptySlotCount = 27;
let lastInventoryFullAlertTime = 0;

let time = "";
let timeGreeting = "";
let lastHealthValue = 20;
let lastAirValue = 300;
let lastFoodValue = 20;
let lastBlockValue: number | undefined = undefined;
let initialAnimation = true;
let sessionLoaded = false;
let initialAnimationDone = false;
let timeLoaded = false;
let isMounted = true;
let currentContent: ContentType = 'greeting';
let nextContent: ContentType | null = null;
let nextContentWidth = 0;
let lastArmorAlertTime = 0;

let animationPhase: 'idle' | 'contract' | 'expand' = 'idle';
let wrapper: HTMLDivElement | null = null;
const contentRefs = {
  alert: null as HTMLDivElement | null,
  greeting: null as HTMLDivElement | null,
  status: null as HTMLDivElement | null
};
$: {
  if ($blockCount !== undefined) {
    checkBlockAlert($blockCount);
  }
}
$: {
  if ($armorValue !== undefined) {
    checkArmorAlert($armorValue, playerData?.armor ?? 0);
  }
}
$: {
    
    if ($emptySlotCount !== undefined) {
      checkInventoryFullAlert($emptySlotCount);
    }
  }
const initialWidth = tweened(0, { duration: 400, easing: cubicOut });
const initialOpacity = tweened(0, { duration: 400, easing: cubicOut });
const w = tweened(400, { duration: 300, easing: cubicOut });
const h = tweened(40, { duration: 300, easing: cubicOut });

function getTimeGreeting(hours: number): string {
  if (hours >= 5 && hours < 12) return "Good morning";
  if (hours >= 12 && hours < 18) return "Good afternoon";
  if (hours >= 18 && hours < 22) return "Good evening";
  return "Good night";
}

function formatTime(hours: number, minutes: number): string {
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function checkUsernameVisibility(): Promise<void> {
  const modules = await getModules();
  showUsername = modules.some(module => 
    module.name === "NameProtect" && !module.enabled
  );
}

function updateTime(): void {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  timeGreeting = getTimeGreeting(hours);
  time = formatTime(hours, minutes);
}

const waitUntilNoAlert = async () => {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (!currentAlert) {
        resolve();
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
};

function showAlert(type: AlertType, title: string, message: string): void {
  if (initialAnimation && !initialAnimationDone) {
    const waitForInitialAnimation = async () => {
      while (initialAnimation && !initialAnimationDone) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      doShowAlert(type, title, message);
    };
    waitForInitialAnimation();
  } else {
    doShowAlert(type, title, message);
  }
}

function doShowAlert(type: AlertType, title: string, message: string): void {
  if (currentAlert) {
    animationPhase = 'contract';
    setTimeout(() => {
      animationPhase = 'expand';
      setTimeout(() => {
        currentAlert = { type, title, message };
        currentContent = 'alert';
        animationPhase = 'idle';
        alertState = 'showing';
        setTimeout(() => hideAlert(), ALERT_DISPLAY_DURATION_MS);
      }, ANIMATION_DURATION_MS);
    }, ANIMATION_DURATION_MS);
  } else {
    currentAlert = { type, title, message };
    currentContent = 'alert';
    animationPhase = 'expand';
    setTimeout(() => {
      animationPhase = 'idle';
      alertState = 'showing';
      setTimeout(() => hideAlert(), ALERT_DISPLAY_DURATION_MS);
    }, ANIMATION_DURATION_MS);
  }
}

function hideAlert(): void {
  if (alertState !== 'showing') return;
  alertState = 'hiding';
  animationPhase = 'contract';
  setTimeout(() => {
    currentAlert = null;
    alertState = 'hidden';
    animationPhase = 'idle';
    switchContent('status');
  }, ANIMATION_DURATION_MS);
}

function checkHealthAlert(newHealth: number): void {
  if (newHealth > 0 && newHealth <= 5 && lastHealthValue > 5) {
    showAlert('health', 'Low Health', 'Your health is severely inadequate !');
  }
  lastHealthValue = newHealth;
}

function checkAirAlert(newAir: number): void {
  if (newAir <= 15 && lastAirValue > 15) {
    showAlert('air', 'Hypoxia', 'Please emerge as soon as possible !');
  }
  lastAirValue = newAir;
}

function checkFoodAlert(newFood: number): void {
  if (newFood < 20 && lastFoodValue === 20) {
    showAlert('hunger', 'Cannot Heal', `Stop combat/food recovery shortly !`);
  } else if (newFood <= 7 && lastFoodValue > 7) {
    showAlert('saturation', 'Hunger',  `Your saturation is critically low (${newFood}/20)`);
  }
  lastFoodValue = newFood;
}
function checkInventoryFullAlert(emptySlots: number) {
    const now = Date.now();
    if (
      emptySlots === 0 &&
      lastEmptySlotCount > 0 &&
      now - lastInventoryFullAlertTime > INVENTORY_FULL_COOLDOWN_MS
    ) {
      showAlert('inventory', 'Inventory Full', 'You cannot bring anything further!');
      lastInventoryFullAlertTime = now;
    }
    lastEmptySlotCount = emptySlots;
  }
function checkArmorDurability() {
  const armor = get(armorDurabilityStore);
  const slots = ['helmet', 'chestplate', 'leggings', 'boots'] as const;
  const now = Date.now();

  for (const slot of slots) {
    const item = armor[slot];
    if (!item) continue;


    const name = typeof item.displayName === 'string'
      ? item.displayName
      : JSON.stringify(item.displayName);

    const ratio = item.durability / item.maxDurability;
    const lastTime = warnedSlots.get(slot) ?? 0;

    if (ratio <= DURABILITY_THRESHOLD && now - lastTime > DURABILITY_COOLDOWN_MS) {
      showAlert(
        'durability',
        `Durability Warn`,
        `${name} Remaining durability is ${Math.round(ratio * 100)}%`
      );
      warnedSlots.set(slot, now);

    } else if (ratio > DURABILITY_RECOVERY && warnedSlots.has(slot)) {
      warnedSlots.delete(slot);
    }
  }
}
function checkArmorAlert(targetArmor: number | undefined, playerArmor: number ): void {
  if (targetArmor === undefined) return;

  const now = Date.now();
  const threshold = armorThreshold + playerArmor;

  if (
    targetArmor > threshold &&
    (now - lastArmorAlertTime > ARMOR_ALERT_DURABILITY_COOLDOWN_MS)
  ) {
    showAlert('armor', 'High Armor Alert', `You're at an equipment disadvantage!`);
    lastArmorAlertTime = now;
  }
}

function checkBlockAlert(newBlock: number | undefined): void {
  if (newBlock === undefined) return;
  
  if (newBlock < 16 && (lastBlockValue === undefined || lastBlockValue >= 16)) {
    showAlert('blocks', 'Low Blocks', ` You've only got ${newBlock} blocks left,Take heed!`);
  } 
  lastBlockValue = newBlock;
}
async function updateSession() {
  session = await getSession();
  sessionLoaded = true;  
}

  async function updatePlayerData() {
  const newData = await getPlayerData();
  if (!newData) return;

  checkHealthAlert(newData.actualHealth);
  checkAirAlert(newData.air);
  checkFoodAlert(newData.food);
  if ($armorValue !== undefined) {

checkArmorAlert($armorValue, newData.armor);

  }
  playerData = newData;
}

async function updateAllData(): Promise<void> {
  const newData = await getPlayerData();
  if (!newData) return;

  clientInfo = await getClientInfo();
  updateTime();  
  session = await getSession();
  sessionLoaded = true;  
  await checkUsernameVisibility();
  await updatePlayerData();
  timeLoaded = true;
  
  if (!currentAlert && wrapper) {
    w.set(wrapper.scrollWidth + 32);
  }

}

async function switchContent(type: ContentType) {
  if (currentContent === type) return;
  nextContent = type;
  const targetEl = contentRefs[type];
   nextContentWidth = targetEl 
  ? targetEl.scrollWidth + 64
  : 300; 
  animationPhase = 'contract';
  currentContent = type;
  w.set(nextContentWidth );
  h.set(type === 'alert' ? 50 : 40);
  animationPhase = 'expand';
  animationPhase = 'idle';
  nextContent = null;
}


async function handleInitialAnimationEnd() {
  await waitUntilNoAlert();
  
 
  while (!sessionLoaded || !session || !timeLoaded || !showUsername) {
    await new Promise((res) => setTimeout(res, 50));
  }

  await tick(); 

  const greetingEl = contentRefs.greeting;
  while (!greetingEl || greetingEl.scrollWidth === 0) {
    await tick(); 
  }

  if (!isMounted) return;

  await new Promise((res) => setTimeout(res, 1500));

  initialAnimation = false;
  initialAnimationDone = true;

  await switchContent('status');
}


$: {
  if (nextContent) {
  w.set(nextContentWidth);
  h.set(nextContent === 'alert' ? 50 : 40);
} else if (initialAnimation) {
  } else {
    const widthMap = {
      alert: 280 + 32,
      greeting: (contentRefs.greeting?.scrollWidth || 0) + 32,
      status: (contentRefs.status?.scrollWidth || 0) + 32

    };
    w.set(widthMap[currentContent]);
    h.set(currentContent === 'alert' ? 50 : 40);
  }
}

onMount(() => {
  isMounted = true;

  (async () => {
    await tick();

    initialWidth.set((wrapper?.scrollWidth || 312) + 64);
    initialOpacity.set(1);

    await updateAllData().catch(console.error);
    await handleInitialAnimationEnd();
  })();

  const interval = setInterval(() => {
    if (isMounted) {
      updateAllData().catch(console.error);
    }
  }, UPDATE_INTERVAL_MS);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
});

listen("session", updateSession);
listen("playerData", (event: ClientPlayerDataEvent) => {
  checkHealthAlert(event.playerData.actualHealth);
  checkAirAlert(event.playerData.air);
  checkFoodAlert(event.playerData.food);

  checkArmorDurability()
  if ($blockCount !== undefined) 
  checkBlockAlert($blockCount);
  if ($armorValue !== undefined) {
  checkArmorAlert($armorValue, event.playerData.armor);
  }
  playerData = event.playerData;
});
armorDurabilityStore.subscribe(() => {
  checkArmorDurability();
});
</script>

<div class="dynamic-island-container">
<div class="dynamic-island {alertState}"
class:notification-active={currentAlert !== null}
     class:contract={animationPhase === 'contract'}
     class:expand={animationPhase === 'expand'}
     class:initial={initialAnimation}
     style="width: {initialAnimation ? $initialWidth : $w}px; 
     height: {initialAnimation ? 40 : ($h + (currentAlert ? 10 : 0))}px;
     opacity: {$initialOpacity};">
  <div class="content-wrapper" bind:this={wrapper}>
    {#if currentAlert}
      <div class="notification-content {currentAlert.type}"
           in:fade={{ duration: 150 }} 
           bind:this={contentRefs.alert}>
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
    {:else if currentContent === 'greeting'}
      <div class="greeting-content" 
           in:fade={{ duration: 150 }} 
           bind:this={contentRefs.greeting}>
        <span class="greeting gradient-text">{timeGreeting}</span>
        {#if sessionLoaded && session !== null && showUsername}
        <span class="username gradient-text">&nbsp;{session.username}~</span>
      {/if}
      
      </div>
    {:else}
      <div class="status-content" 
           in:fade={{ duration: 150 }} 
           bind:this={contentRefs.status}>
        {#if timeLoaded}
          <span class="client gradient-text">{CLIENT_NAME}&nbsp;{CLIENT_VERSION}</span>
          <div class="separator"></div>
          <span class="time gradient-text">{time}</span>
          {#if session && showUsername}
            <div class="separator"></div>
            <span class="username gradient-text">User: {session.username}</span>
          {/if}
        {/if}
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
top: 5px;
left: 50%;
transform: translateX(-50%);
perspective: 1000px;
filter: 
  drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))
  drop-shadow(0 8px 24px rgba(0, 0, 0, 0.2))
  drop-shadow(0 16px 48px rgba(0, 0, 0, 0.15));

}

.dynamic-island {
overflow: hidden;
border-radius: 20px;
background: rgba(20, 20, 20, 0.5);
backdrop-filter: blur(12px) brightness(1.1);
color: rgba(var(--text), 0.9);
padding: 0 16px;
display: flex;
align-items: center;
transition: 
  width 0.3s cubic-bezier(0.25, 1, 0.5, 1),
  height 0.3s cubic-bezier(0.25, 1, 0.5, 1),
  border-radius 0.3s 0.1s cubic-bezier(0.4, 0, 0.2, 1),
  box-shadow 0.3s ease;
transform-style: preserve-3d;
box-shadow: 
  0 4px 16px rgba(0, 0, 0, 0.6),
  inset 0 0 10px rgba(255, 255, 255, 0.05);

&.expand {
  border-radius: 16px;

}

&.showing {
  transition-timing-function: cubic-bezier(0.5, 0, 0.75, 0);
}

&.hiding {
  transition-timing-function: cubic-bezier(0.25, 1, 0.5, 1);
}

&.initial {
  transform-origin: center;
  animation: initialExpand 0.5s cubic-bezier(0.2, 0, 0.1, 1) forwards;

  &:not(.showing):not(.hiding) {
    transform-origin: center;
    animation: initialExpand 0.5s cubic-bezier(0.2, 0, 0.1, 1) forwards;
  }

  .greeting-content {
    justify-content: center;
    opacity: 0;
    animation: fadeIn 0.4s 0.3s forwards;
  }
}
}

.content-wrapper {
width: 100%;
display: flex;
align-items: center;
overflow: hidden;
position: relative;
}

.greeting-content,
.status-content {
display: flex;
align-items: center;
gap: 8px;
width: 100%;
font-size: 14px;
white-space: nowrap;

.client, .greeting, .time,.username {
  font-size: 20px;
  letter-spacing: -0.25px;
  flex-shrink: 0;   
  color: #bbbbbb;
  text-shadow: 0 0 3px rgba(170, 170, 170, 0.9);
  font-feature-settings: "tnum";
  font-variant-numeric: tabular-nums;
}


.separator {
  width: 2px;
  height: 14px;
  background: linear-gradient(to bottom, transparent, rgba(($text), 0.7), transparent);
  flex-shrink: 0; 
  position: relative;
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
&.durability .icon img{

filter: 
  brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(30deg)
  drop-shadow(0 0 5px rgba(255, 180, 50, 0.7));
}
&.inventory.icon img{

filter: 
  brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(30deg)
  drop-shadow(0 0 5px rgba(255, 180, 50, 0.7));
}
&.blocks .icon img{

  filter: 
    brightness(0.8) saturate(200%) invert(25%) sepia(90%) saturate(2000%) hue-rotate(30deg)
    drop-shadow(0 0 5px rgba(255, 180, 50, 0.7));
}
&.armor .icon img{

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
      &.blocks { background: linear-gradient(90deg, #ff9f0a, #ffd60a); }
      &.armor{ background: linear-gradient(90deg, #ff9f0a, #ffd60a); }
      &.durability{ background: linear-gradient(90deg, #ff9f0a, #ffd60a); }
      &.saturation { background: linear-gradient(90deg, #ff640a, #ffab5e); }
      &.inventory{ background: linear-gradient(90deg, #ff9f0a, #ffd60a); }
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
  &.durability{
    .title { 
      color: #ff9f0a;
      background: linear-gradient(90deg, #ff9f0a, #ffd60a);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }
  &.inventory { 
    .title { 
      color: #ff9f0a;
      background: linear-gradient(90deg, #ff9f0a, #ffd60a);
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
  &.blocks{
  .title { 
      color: #ff9f0a;
      background: linear-gradient(90deg, #ff9f0a, #ffd60a);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }
  &.armor{
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
@keyframes initialExpand {
0% {
  width: 0;
  opacity: 0;
  transform: scaleX(0.1);
}
70% {
  opacity: 1;
  transform: scaleX(1.1);
}

100% {
  transform: scaleX(1);
  opacity: 1;
}
}

@keyframes fadeIn {
from { opacity: 0; }
to { opacity: 1; }
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