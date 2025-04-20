<script lang="ts">
    import { onMount } from 'svelte';
    import { onDestroy } from 'svelte';
    import type { Component } from '../integration/types';
    import { isEditingHud } from '../integration/hudEdit';
  
    export let components: Component[] = [];
    let isDragging = false;
    let draggingComponent: Component | null = null;
    let offsetX = 0;
    let offsetY = 0;
  
         $: if ($isEditingHud) {
      console.log("Editing mode is ON");
    } else {
      console.log("Editing mode is OFF");
    }
    function onMouseDown(event: MouseEvent, comp: Component) {
  if (!$isEditingHud) return;
  
  isDragging = true;
  draggingComponent = comp;
  offsetX = event.clientX - comp.x;
  offsetY = event.clientY - comp.y;

  const handleMove = (e: MouseEvent) => onMouseMove(e);
  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove);
    window.removeEventListener('mouseup', handleUp);
    isDragging = false;
    draggingComponent = null;
  };

  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleUp);
}
    function onMouseMove(event: MouseEvent) {
      if (draggingComponent) {
        draggingComponent.x = event.clientX - offsetX;
        draggingComponent.y = event.clientY - offsetY;
      }
    }
  
    function onMouseUp() {
      draggingComponent = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
  
    onDestroy(() => {
  if (isDragging) {
         window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }
});
  
    onMount(() => {
      console.log("HudLayoutEditor mounted");

    });
  </script>
  
  <style>
    .editor-wrapper {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1080px;
      pointer-events: none;
    }
    .component {
      position: absolute;
      background: rgba(255, 255, 255, 0.1);
      border: 1px dashed white;
      padding: 8px;
      cursor: move;
      pointer-events: all;
    }
  </style>
  
  <div class="editor-wrapper">
    {#each components as comp (comp.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="component"
        style="left: {comp.x}px; top: {comp.y}px;"
        on:mousedown={(e) => onMouseDown(e, comp)}
      >
        {comp.name}
      </div>
    {/each}
  </div>
  