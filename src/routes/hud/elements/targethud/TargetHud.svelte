<script lang="ts">
    import { listen } from "../../../../integration/ws.js";
    import type {  PlayerData } from "../../../../integration/types";
    import { REST_BASE } from "../../../../integration/host";
    import { elasticOut, quintOut } from "svelte/easing";
    import { onMount, onDestroy } from "svelte";
    import ArmorStatus from "./ArmorStatus.svelte";

    let displayHealth = 0;
    let animationFrameId: number | null = null;
    let target: PlayerData | null = null;
    let visible = true;
    let lastHealth: number | null = null;
    let hideTimeout: ReturnType<typeof setTimeout>;
    let attacked = false;
    let particleId = 0;
    let particles: Particle[] = [];
    let animationFrame: number;
    let simulatedHurtTime = 0;
    let hurtTimeTick: ReturnType<typeof setInterval>;
    const PARTICLE_COUNT = 10;
    let lastAttackTime = 0;
    const ATTACK_COOLDOWN = 450; 
    const MAX_PARTICLES = 150;      const PARTICLE_LIFETIME = 2000;  const PARTICLE_FADE_TIME = 500;  let lastParticleSpawnTime = 0;
const PARTICLE_SPAWN_COOLDOWN = 100; 
interface Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
    color: string;
    bornAt: number;
    fadeStart: number;
    shadowColor: string;
}
       function animateHealth(targetHealth: number) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        const animate = () => {
            const diff = targetHealth - displayHealth;
                         if (Math.abs(diff) < 0.05) {
                displayHealth = targetHealth;
                return;
            }
                         displayHealth += diff * 0.1;
            animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }
         function pop(node: Element, { delay = 0, duration = 400 }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        return {
            delay,
            duration,
            css: (t: number) => {
                const eased = elasticOut(t);
                const fadeEased = quintOut(t);
                return `
                    transform: ${transform} scale(${eased * 0.2 + 0.8});
                    opacity: ${fadeEased * opacity};
                `;
            }
        };
    }
    function popOut(node: Element, { delay = 0, duration = 1000 }) {
    const style = getComputedStyle(node);
    const opacity = +style.opacity;
    const transform = style.transform === 'none' ? '' : style.transform;
    return {
        delay,
        duration,
        css: (t: number) => {
                         const progress = 1 - t;
                         const scaleProgress = progress < 0.5 
                ? easeOutQuad(progress * 2)                        : easeInQuad(1 - (progress - 0.5) * 2);              
            const scale = 1 + scaleProgress * 0.2;              
                         const opacityEased = progress < 0.5 
                ? 1 
                : easeInQuad(1 - (progress - 0.5) * 2);
            return `
                transform: ${transform} scale(${scale});
                opacity: ${opacity * opacityEased};
            `;
        }
    };
}
 function easeOutQuad(t: number): number {
    return t * (2 - t);
}
function easeInQuad(t: number): number {
    return t * t;
}
function getRandomThemeColor() {
    const ratio = Math.random();
    const r = Math.round(themeColor1.r + (themeColor2.r - themeColor1.r) * ratio);
    const g = Math.round(themeColor1.g + (themeColor2.g - themeColor1.g) * ratio);
    const b = Math.round(themeColor1.b + (themeColor2.b - themeColor1.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
}
const themeColor1 = { r: 173, g: 83, b: 137 };   const themeColor2 = { r: 60, g: 16, b: 83 };     const startColor = { r: 173, g: 83, b: 137 };   const endColor = { r: 60, g: 16, b: 83 };      
function spawnParticles(hurtTimeTick = 1) {
    const now = Date.now();
    if (now - lastParticleSpawnTime < PARTICLE_SPAWN_COOLDOWN) return;
    lastParticleSpawnTime = now;
    const avatar = document.querySelector('.avatar') as HTMLElement;
    const hud = document.querySelector('.targethud') as HTMLElement;
    if (!avatar || !hud) return;
    particles = particles.filter(p => now - p.bornAt < PARTICLE_LIFETIME);
    const availableSlots = MAX_PARTICLES - particles.length;
    if (availableSlots <= 0) return;
    const count = Math.min(Math.floor(PARTICLE_COUNT * hurtTimeTick), availableSlots);
    const avatarRect = avatar.getBoundingClientRect();
    const hudRect = hud.getBoundingClientRect();
    const globalOffset = 16;  
         const centerX = avatarRect.left - hudRect.left + avatarRect.width / 2 + globalOffset;
    const centerY = avatarRect.top - hudRect.top + avatarRect.height / 2 + globalOffset;
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2 * hurtTimeTick;
        const size = 3 + Math.random() * 7;
        const lifetimeOffset = Math.random() * 500;
        const particleColor = getRandomThemeColor();
        particles.push({
            id: particleId++,
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size,
            opacity: 1,
            color: particleColor,
            shadowColor: particleColor,
            bornAt: now,
            fadeStart: now + PARTICLE_LIFETIME - PARTICLE_FADE_TIME - lifetimeOffset
        });
    }
}
function updateParticles() {
    const now = Date.now();
    particles = particles.map(p => {
                 const newX = p.x + p.vx;
        const newY = p.y + p.vy;
                 let opacity = p.opacity;
        if (now > p.fadeStart) {
            opacity = 1 - (now - p.fadeStart) / PARTICLE_FADE_TIME;
        }
        return {
            ...p,
            x: newX,
            y: newY,
            opacity: Math.max(opacity, 0)
        };
    }).filter(p => now - p.bornAt < PARTICLE_LIFETIME && p.opacity > 0.01);
    animationFrame = requestAnimationFrame(updateParticles);
}
onMount(() => {
    updateParticles();
    spawnParticles(1);
    hurtTimeTick = setInterval(() => {
        if (simulatedHurtTime > 0) {
            simulatedHurtTime-=1;
        }
    }, 50);
});
onDestroy(() => {
    cancelAnimationFrame(animationFrame);
    clearInterval(hurtTimeTick);  });
    function startHideTimeout() {
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
            visible = false;
        }, 1500);
    }
    listen("targetChange", (data: { target: PlayerData | null; }) => {
    const now = Date.now();
    const newTarget = data.target;
    target = newTarget;
    visible = true;
    if (newTarget) {
                 if (now - lastAttackTime >= ATTACK_COOLDOWN) {
            attacked = true;
            setTimeout(() => attacked = false, 450);
            lastAttackTime = now;
        }
                 if (lastHealth !== null && newTarget.actualHealth < lastHealth) {
            simulatedHurtTime = Math.max(simulatedHurtTime, 10);
                         const avatar = document.querySelector('.avatar') as HTMLElement | null;
            if (avatar) {
                avatar.classList.remove('hurt');
                void avatar.offsetWidth;
                avatar.classList.add('hurt');
            }
            const damage = lastHealth - newTarget.actualHealth;
            spawnParticles(Math.min(damage / 3, 5));
        }
        animateHealth(newTarget.actualHealth);
    } else {
        displayHealth = 0;
    }
    lastHealth = newTarget?.actualHealth ?? null;
    startHideTimeout();
});

</script>
{#if visible && target}
  <div
    class="targethud"
    in:pop|global={{ duration: 400 }}
    out:popOut|global={{ duration: 300 }}
  >
    <div class="main-wrapper">
      <!-- Avatar -->
      <div class="avatar {attacked || simulatedHurtTime > 0 ? 'attacked' : ''}">
        <img
          src="{REST_BASE}/api/v1/client/resource/skin?uuid={target.uuid}"
          alt="avatar"
          style="{simulatedHurtTime > 0 ? 'filter: brightness(0.9)' : ''}"
        />
      </div>
      <!-- Name -->
        <span class="name">Name: {target.username}</span>
      <div class="armor-stats">
        {#if target.offHandStack?.identifier && !target.offHandStack.identifier.includes('air')}
        <ArmorStatus itemStack={target.offHandStack} />
      {/if}
        {#if target.mainHandStack?.identifier && !target.mainHandStack.identifier.includes('air')}
        <ArmorStatus itemStack={target.mainHandStack} />
      {/if}
        {#if target.armorItems[3].count > 0}
        <ArmorStatus itemStack={target.armorItems[3]} />
    {/if}
    {#if target.armorItems[2].count > 0}
        <ArmorStatus itemStack={target.armorItems[2]} />
    {/if}
    {#if target.armorItems[1].count > 0}
        <ArmorStatus itemStack={target.armorItems[1]} />
    {/if}
    {#if target.armorItems[0].count > 0}
        <ArmorStatus itemStack={target.armorItems[0]} />
    {/if}
      </div>
    </div>
    <div class="health-container">
      <div class="health-bg">
        {#if target}
          <div
            class="health-fill"
            style="width: {Math.floor((displayHealth / (target.maxHealth + target.absorption)) * 100)}%;"
            >
            <span 
            class="health-text" 
            style="opacity: {displayHealth > 0 ? simulatedHurtTime / 10 : 0}; 
                   transition: opacity 0.3s ease;"
          >
            {displayHealth % 1 === 0 ? displayHealth.toFixed(0) : displayHealth.toFixed(1)}
          </span>
          </div>
        {/if}
      </div>
    </div>
    <div class="particles-container">
      {#each particles as p (p.id)}
      <div
      class="particle {
          p.size <= 3 ? 'small' : 
          p.size <= 5 ? 'medium' : 
          'large'
      }"
          style="
              left: {p.x}px;
              top: {p.y}px;
              width: {p.size}px;
              height: {p.size}px;
              background-color: {p.color};
              opacity: {p.opacity};
              --shadow-color: {p.shadowColor};
          "
      ></div>
      {/each}
  </div>
</div>
{/if}

<style lang="scss">
@import "../../../../colors.scss";
.targethud {
  position: relative;
  width: 260px;
  border-radius: 20px;
  padding: 10px 0 20px;
  box-shadow:
    0 0 20px rgba(0, 0, 0, 0.7),
    0 0 40px rgba(255, 255, 255, 0.05),
    inset 0 0 12px rgba(255, 255, 255, 0.04);
}
.targethud::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0) 45%,
    rgba(255, 255, 255, 0.03) 48%,
    rgba(255, 255, 255, 0) 52%
  );
  transform: rotate(30deg);
  animation: shine 6s infinite;
  z-index: 1;
}
@keyframes shine {
  0%, 100% { opacity: 0; }
  50% { opacity: 0.8; }
}
.targethud::before {
  content: "";
  position: absolute;
  inset: 0;
  background: 
    linear-gradient(135deg, 
      rgba(255, 255, 255, 0.05) 0%,
      rgba(0, 0, 0, 0.3) 50%,
      rgba(255, 255, 255, 0.03) 100%
    );
  border-radius: inherit;
  z-index: 0;
}
.main-wrapper {
  position: relative;   
  z-index: 1;
  display: grid;
  grid-template-areas:
    "avatar name"
    "avatar armor";
  grid-template-columns: 50px 1fr;
  column-gap: 10px;
  row-gap: 4px;
  padding: 10px;
}
.avatar {
  grid-area: avatar;
  height: 50px;
  width: 50px;
  image-rendering: pixelated;
  background-image: url("/img/steve.png");
  background-repeat: no-repeat;
  background-size: cover;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
  transition: all 0.2s ease;
  &.attacked {
    animation: hitScale 0.4s ease-out;
  }
  &.attacked {
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      background: linear-gradient(
        rgba(255, 0, 0, 0.6),
        rgba(200, 0, 0, 0.4)
      );
      border-radius: 6px;
      animation: fadeRed 0.5s linear forwards;
      z-index: 2;
      box-shadow: 
        inset 0 0 20px rgba(255, 50, 50, 0.7),
        0 0 15px rgba(255, 0, 0, 0.4);
    }
    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle at center,
        rgba(255, 0, 0, 0.4) 0%,
        rgba(200, 0, 0, 0.2) 70%,
        transparent 100%
      );
      z-index: 3;
      animation: pulseGlow 0.2s ease-out infinite;
    }
  }
  img {
    position: absolute;
    scale: 6.25;
    left: 118px;
    top: 118px;
    transition: transform 0.2s ease;
    z-index: 1;    }
}
.name {
  grid-area: name;
  padding-left: 0;
  font-size: 14px;
  font-family: 'Inter';
  color: white;
  text-shadow: 0 0 4px rgba(white,0.8);
  align-self: start;
  margin-top: -2px;
  letter-spacing: 1px;
}
.armor-stats {
  grid-area: armor;
  display: flex;
  align-items: center;
  position: absolute;
  display: flex;
  bottom: 0.6px;
  margin: 0;
  gap:1px;
  padding: 0;
  justify-content: flex-start;
}
.health-container {
  position: absolute;
  bottom: 6px;
  left: 10px; 
  right: 16px;
  height: 16px;
  max-width: 95%; 
}
.health-bg {
  position: relative;
  height: 5px;
  border-radius: 4px;
  overflow: visible;
  max-width: 95%;
  background-color: rgba(0, 0, 0, 0.3);
  box-shadow:
      0 0 8px rgba(black, 0.2),
      0 0 12px rgba(black, 0.3),
      0 0 20px rgba(black, 0.3),
      0 0 24px rgba(black, 0.2);
}
.health-fill {
  transition: width 100ms ease-out;
  position: relative;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba($accent-color, 0.8) 10%,   
    rgba($accent-color-2, 0.8) 90%   
  );
  border-radius: 4px;  
  transition: width 0.3s ease;
  max-width: 95%;  
  min-width: 50px;
}
.health-fill::before {
  content: "";
  position: absolute;
  inset: 0;  
  border-radius: inherit;  
  box-shadow:
    0 0 4px rgba($accent-color, 0.2),  
    0 0 6px rgba($accent-color, 0.3), 
    0 0 10px rgba($accent-color-2, 0.3), 
    0 0 14px rgba($accent-color-2, 0.2);   
  z-index: -1;  
}
.health-text {
  position: absolute;
  left: 100%; 
  margin-left: 8px; 
  bottom: 0; 
  transform: translateY(25%);
  font-family: 'Inter';
  font-size: 14px;
  color: white;
  transition: opacity 0.3s ease;
  white-space: nowrap;
  text-shadow: 0 0 2px black;
  pointer-events: none;
  opacity: 1; 
  max-width: 60px;
  text-overflow: ellipsis;
  overflow: hidden;
}
.particles-container {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 10;
}
.particle {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
    transform: translate(-50%, -50%);
    z-index: 20;
    transition: opacity 0.2s linear;
    will-change: transform, opacity;
    box-shadow: 
        0 0 2px 1px color-mix(in srgb, var(--shadow-color) 60%, transparent);
}
.particle.small {
    box-shadow: 
        0 0 4px 2px color-mix(in srgb, var(--shadow-color) 80%, transparent),
        0 0 8px 3px color-mix(in srgb, var(--shadow-color) 30%, transparent);
}
.particle.medium {
    box-shadow: 
        0 0 8px 4px color-mix(in srgb, var(--shadow-color) 60%, transparent),
        0 0 16px 6px color-mix(in srgb, var(--shadow-color) 20%, transparent);
}
.particle.large {
    box-shadow: 
        0 0 12px 6px color-mix(in srgb, var(--shadow-color) 50%, transparent),
        0 0 24px 10px color-mix(in srgb, var(--shadow-color) 15%, transparent);
}
@keyframes hitScale {
    0% { transform: scale(1); }
    50% { transform: scale(0.9); }
    100% { transform: scale(1); }
}
@keyframes fadeRed {
  0% { 
    opacity: 1;
    background: rgba(255, 0, 0, 0.5);
    box-shadow: inset 0 0 25px rgba(255, 50, 50, 0.7);
  }
  70% { 
    opacity: 0.6;
    background: rgba(255, 0, 0, 0.3);
  }
  100% { 
    opacity: 0;
    background: rgba(255, 0, 0, 0.1);
    box-shadow: inset 0 0 10px rgba(255, 50, 50, 0.2);
  }
}
</style>
