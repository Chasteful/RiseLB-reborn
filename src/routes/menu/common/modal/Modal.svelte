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

  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: none;
    z-index: 99999;
  }

  .modal {
    background-color: rgba($crust, 0.7);
    min-width: 500px;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    padding: 20px;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    backdrop-filter: blur(16px);
    box-shadow: 0 0 32px rgba($crust, 0.8);
    border: 4px solid $accent;
  }

  .titlebar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: rgba($crust, 0.75);
    padding: 8px 12px;
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
    cursor: move;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }

  .title {
    color: $text;
    font-size: 18px;
    font-weight: bold;
  }

  .button-modal-close {
    font-size: 18px;
    color: $text;
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;

    &:hover {
      color: $accent;
    }
  }

  .content {
    display: flex;
    flex-direction: column;
    row-gap: 20px;
    margin-top: 40px;
  }

  @media screen and (max-width: 1366px) {
    .modal {
      zoom: 0.8;
    }
  }

  @media screen and (max-width: 1200px) {
    .modal {
      zoom: 0.5;
    }
  }

  @media screen and (max-height: 1100px) {
    .modal {
      zoom: 0.8;
    }
  }

  @media screen and (max-height: 700px) {
    .modal {
      zoom: 0.5;
    }
  }

  @media screen and (max-height: 540px) {
    .modal {
      zoom: 0.4;
    }
  }
</style>
