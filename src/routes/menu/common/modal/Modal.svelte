<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { fade, scale } from "svelte/transition";

  export let title: string;
  export let visible: boolean;

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let modal: HTMLDivElement | null = null;
  let titleBar: HTMLDivElement | null = null;

  function handleClick() {
    dispatch("close");
    visible = false;
  }

  function startDrag(event: MouseEvent) {
    if (titleBar && modal) {
      isDragging = true;

      const modalRect = modal.getBoundingClientRect();
      offsetX = event.clientX - (modalRect.left + modalRect.width / 2);
      offsetY = event.clientY - (modalRect.top + modalRect.height / 2);

      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag);
    }
  }

  function onDrag(event: MouseEvent) {
    if (isDragging && modal) {
      modal.style.left = `${event.clientX - offsetX}px`;
      modal.style.top = `${event.clientY - offsetY}px`;
    }
  }

  function stopDrag() {
    isDragging = false;
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }
</script>

{#if visible}
  <div class="modal-wrapper" transition:fade={{ duration: 500, easing: cubicOut }}>
    <div class="modal" bind:this={modal} transition:scale={{ duration: 500, easing: cubicOut }}>
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="titlebar" bind:this={titleBar} on:mousedown={startDrag}>
        <div class="title">{title}</div>
        <button class="button-modal-close" on:click={handleClick}>X</button>
      </div>

      <div class="content">
        <slot />
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @import "../../../../colors";

  @import "../../../../colors";

.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.02); 
  z-index: 99999;
  backdrop-filter: blur(2px);
}

.modal {
  background: rgba(255, 255, 255, 0.07); 
  backdrop-filter: blur(20px);
  border-radius: 16px;
  border: 1.5px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); 
  min-width: 460px;
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.titlebar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  backdrop-filter: blur(6px);
  color: #d0d0e0;
  font-size: 16px;
  font-weight: 500;
  border-radius: 12px 12px 0 0;
  cursor: move;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
}

.title {
  color: #e0e0f0;
  font-size: 18px;
  font-weight: 600;
}

.button-modal-close {
  font-size: 18px;
  color: #bbb;
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: #8ab4f8;
  }
}

.content {
  margin-top: 52px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #ddddf0;
  font-size: 15px;
}

@media screen and (max-width: 1366px) {
  .modal {
    zoom: 0.85;
  }
}
@media screen and (max-width: 1200px) {
  .modal {
    zoom: 0.7;
  }
}
@media screen and (max-height: 800px) {
  .modal {
    zoom: 0.6;
  }
}

</style>
