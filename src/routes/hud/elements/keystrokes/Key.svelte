<script lang="ts">
  import { listen } from "../../../../integration/ws";
  import type { KeyEvent } from "../../../../integration/events";
  import type { MinecraftKeybind } from "../../../../integration/types";

  export let gridArea: string;
  export let key: MinecraftKeybind | undefined;

  let active = false;
  let actived = false;

listen("key", (e: KeyEvent) => {
  if (e.key !== key?.key.translationKey) return;
  if (e.action === 1 || e.action === 2) {
    active = true;
    actived = false;
  } else {
    active = false;
    actived = true;
    // 延迟清除 actived 状态，防止 class 一直留着
    setTimeout(() => (actived = false), 200);
  }
});
  listen("key", (e: KeyEvent) => {
      if (e.key !== key?.key.translationKey) return;
      active = e.action === 1 || e.action === 2;
  });
</script>

<div class="key" style="grid-area: {gridArea};" class:active class:actived>
  {key?.key.localized ?? "???"}
</div>


<style lang="scss">
@use "../../../../colors.scss" as *;
@keyframes activeEffect {
  0% {
    transform: scale(0.1);
    opacity: 0.1;
  }
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
}

@keyframes activedEffect {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(0.1);
    opacity: 0;
  }
}

.key {
  height: 50px;
  color: $text;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  text-transform: uppercase;
  position: relative;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  border-radius: 12px;
  transition: box-shadow 0.1s ease;

  &:active {
    box-shadow: 0 0 10px rgba($key-color, 0.6) inset;
  }

  &:hover {
    box-shadow: 0 0 6px rgba($key-color, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba($base, 0.2);
    border-radius: inherit;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba($key-color, 1);
    border-radius: inherit;
    transform: scale(0.1);
    opacity: 0;
    z-index: 1;
    transform-origin: center;
    pointer-events: none;
  }

  &.active::after {
    animation: activeEffect 0.2s ease forwards;
  }

  &.actived::after {
    animation: activedEffect 0.2s ease forwards;
  }
}

</style>