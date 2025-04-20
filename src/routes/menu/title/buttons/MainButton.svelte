<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let title: string;
  export let icon: string;
  // svelte-ignore export_let_unused
export let index: number;

  let hovered = false;

  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-click-events-have-key-events -->
<div class="main-button" on:mouseenter={() => hovered = true} on:mouseleave={() => hovered = false} on:click={() => hovered = false}
   on:click={() => dispatch("click")}>
  <div class="icon">
    <img src="img/menu/icon-{icon}.svg" alt={icon}>
  </div>

  <div class="title">{title}</div>

  <div class="wrapped-content">
      <slot parentHovered={hovered}/>
  </div>
</div>

<style lang="scss">
@use "../../../../colors.scss" as *;
.main-button {
  background-color: rgba($base, 0.9);
  width: 590px;
  padding: 25px 35px;
  display: grid;
  grid-template-columns: max-content 1fr max-content;
  justify-items: center;  // 水平居中
  align-items: center;    // 垂直居中
  cursor: pointer;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 36px;
  z-index: 1;
  text-decoration: none;
  overflow: hidden;
  letter-spacing: 1px;
  transition: 0.5s;
  backdrop-filter: blur(15px);
  position: relative;  

  &::before {
    content: '';
    position: absolute;
    width: 100%;  
    height: 100%; 
    background: linear-gradient(to right, rgba(255, 255, 255, 0.1), transparent);
    transform: skewX(45deg) translateX(-10%);
    transition: 0.5s;
  }

  &:hover::before {
    transform: skewX(45deg) translateX(200%);
  }

  &:hover {
    transform: scale(1.1);
    letter-spacing: 3px;
  }
}
.icon {
  width: 90px;
  height: 90px;
  scale: 1.25;
  position: relative;

  img {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}

.title {
  font-size: 26px;
  color: $text;
  filter: drop-shadow(4px 4px 16px $mantle);
  font-weight: 600;
  transition: letter-spacing 0.2s ease;
}
</style>
