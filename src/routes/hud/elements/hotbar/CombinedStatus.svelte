<script lang="ts">
  export let health: number;
  export let absorption: number;
  export let max: number;


  $: total = Math.max(health + absorption, max, 1);


  $: healthPct   = Math.min(Math.max(health     / total, 0), 1) * 100;
  $: absorbPct   = Math.min(Math.max(absorption / total, 0), 1) * 100;
  $: absorbStart = healthPct;
  $: absorbEnd   = healthPct + absorbPct;

  $: hpColor  = getHealthColor(health / max);
  $: abColor  = 'rgba(212,175,55,0.8)';

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
      { h: 0,   s:100, l:60 },
      { h: 30,  s:100, l:60 },
      { h: 60,  s:100, l:60 },
      { h: 90,  s: 80, l:70 },
      { h:120,  s: 60, l:80 }
    ];
    const t = Math.min(Math.max(p,0),1);
    const idx = Math.floor(t*(stops.length-1));
    const nxt = Math.min(idx+1, stops.length-1);
    const r  = t*(stops.length-1)-idx;
    const a = stops[idx], b = stops[nxt];
    const h = a.h + (b.h-a.h)*r;
    const s = a.s + (b.s-a.s)*r;
    const l = a.l + (b.l-a.l)*r;
    return hslToRgba(h,s,l,0.9);
  }

  function hslToRgba(h:number,s:number,l:number,a:number) {
    h/=360; s/=100; l/=100;
    let r,g,b;
    if(s===0) r=g=b=l;
    else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if(t<0) t+=1; if(t>1) t-=1;
        if(t<1/6) return p+(q-p)*6*t;
        if(t<1/2) return q;
        if(t<2/3) return p+(q-p)*(2/3-t)*6;
        return p;
      };
      const q = l<0.5?l*(1+s):l+s-l*s;
      const p = 2*l-q;
      r = hue2rgb(p,q,h+1/3);
      g = hue2rgb(p,q,h);
      b = hue2rgb(p,q,h-1/3);
    }
    return `rgba(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)},${a})`;
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

<div class="bar" style="background: {barStyle}">
  <div class="text">
    {health}{#if absorption>0}+{absorption}{/if}/{max}
  </div>
</div>

<style lang="scss">
.bar {
  width: 400px; 
  height: 12px;
  border-radius: 3px;
  overflow: hidden;
  position: relative; 
  box-shadow: 0 0 4px rgba(0,0,0,0.3);
}

.text {
  position: absolute; 
  inset: 0;
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  z-index: 1;
}
</style>
