<script lang="ts">
  export let health: number;
  export let absorption: number;
  export let max: number;

  $: isLowHealth = health <= 4;
  let blink = false;
  $: bgFlash = isLowHealth && blink ? 'rgba(253,113,90,0.3)' : 'transparent';

  if (isLowHealth) {
    const interval = setInterval(() => blink = !blink, 500);
    $: if (!isLowHealth) clearInterval(interval);
  }
  
  $: total = Math.max(health + absorption, max, 1);
  
  // Add animation variables
  let animateFrom: number | null = null;
  let showAnimation = false;
  
  // Function to trigger animation
  function triggerAnimation() {
    animateFrom = health + absorption;
    showAnimation = true;
    setTimeout(() => showAnimation = false, 100);
  }
  
  // Trigger animation when health or absorption changes
  $: if (health !== animateFrom && absorption !== animateFrom) {
    triggerAnimation();
  }

  $: barBgStyle = `linear-gradient(
    to bottom,
    ${bgFlash},
    rgba(154,216,31,0.1),
    rgba(20,20,20,0.5)
  )`;
  $: healthPct   = Math.min(Math.max(health     / total, 0), 1) * 100;
  $: absorbPct   = Math.min(Math.max(absorption / total, 0), 1) * 100;
  $: absorbStart = healthPct;
  $: absorbEnd   = healthPct + absorbPct;

  $: hpColor  = getHealthColor(health / max);
  $: abColor  = 'rgba(212,175,55,0.7)';

  $: midBlend = mixRgbaColors(hpColor, abColor, 0);

  $: barStyle = `linear-gradient(to right,
    ${hpColor}   0%,
    ${hpColor}   ${healthPct - 1}%,
    ${midBlend}  ${healthPct}%,
    ${midBlend}  ${absorbStart}%,
    ${abColor}   ${absorbEnd}%,
    rgba(0,0,0,0.4) ${absorbEnd}%,
    rgba(0,0,0,0.4) 100%
  )`;

  function getHealthColor(p: number): string {
    const stops = [
      { h: 83,  s:75,  l:48 },  
      { h: 20,  s:95,  l:55 },  
      { h: 5,   s:100, l:60 },  
    ];
    
    const t = Math.min(Math.max(p, 0), 1);
    
    if (t > 0.3) {
      return hslToRgba(stops[0].h, stops[0].s, stops[0].l, 0.7);
    }
    if (t > 0.25) {
      return hslToRgba(stops[1].h, stops[1].s, stops[1].l, 0.7);
    }
    return hslToRgba(stops[2].h, stops[2].s, stops[2].l, 0.7);
  }

  function hslToRgba(h: number, s: number, l: number, a: number): string {
    h /= 360; s /= 100; l /= 100;
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; 
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1; 
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
  }

  function mixRgbaColors(c1:string,c2:string,ratio:number):string {
    const [r1,g1,b1,a1] = c1.match(/[\d.]+/g)!.map(Number);
    const [r2,g2,b2,a2] = c2.match(/[\d.]+/g)!.map(Number);
    const r = Math.round(r1*(1-ratio)+r2*ratio);
    const g = Math.round(g1*(1-ratio)+g2*ratio);
    const b = Math.round(b1*(1-ratio)+b2*ratio);
    const a = a1*(1-ratio)+a2*ratio;
    return `rgba(${r},${g},${b},${a})`;
  }
</script>

<div class="bar-container">
  {#if showAnimation}
    <!-- svelte-ignore element_invalid_self_closing_tag -->
    <div class="animation-layer" 
         style="--bar-width: {animateFrom / total * 100}%;
                background: {hslToRgba(37, 49, 99, 0.7)}" />
  {/if}
  <div class="bar" style="--bar-bg: {barBgStyle}; background: {barStyle}">
    <div class="text">
      {health}{#if absorption>0}+{absorption}{/if}/{max}
    </div>
  </div>
</div>

<style lang="scss">
.bar-container {
  position: relative;
  width: 400px;
  height: 14px;
}

.animation-layer {
  position: absolute;
  width: calc(var(--bar-width) * 1%);
  height: 100%;
  transition: width 0.1s ease-out;
  clip-path: polygon(
    3% 0%, 
    97% 0%,   
    100% 50%,
    97% 100%, 
    3% 100%, 
    0% 50%  
  );
  border-radius: 7px;
  z-index: 0;
}

.bar {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--bar-bg);
  clip-path: polygon(
    3% 0%, 
    97% 0%,   
    100% 50%,
    97% 100%, 
    3% 100%, 
    0% 50%  
  );
  border-radius: 7px; 
  background-size: 100% 100%;
  background-repeat: no-repeat;
  transition: background 0.3s ease;
  z-index: 1;
}
  
.text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  z-index: 2;
  font-family: 'Arial', sans-serif;
}
</style>