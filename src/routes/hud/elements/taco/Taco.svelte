<script lang="ts">
    import type { HUDComponentSettings } from "../../../../integration/types";
  let text = "LBNG HUD";
  let pos = { x: 50, y: 50 };
  let dragging = false;
  let offset = { x: 0, y: 0 };
  export let editing: boolean = false;
  function onMouseDown(event: MouseEvent) {
    if (!editing) return;
    dragging = true;
    offset = {
      x: event.clientX - pos.x,
      y: event.clientY - pos.y
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(event: MouseEvent) {
    if (!dragging) return;
    pos.x = event.clientX - offset.x;
    pos.y = event.clientY - offset.y;
  }

  function onMouseUp() {
    dragging = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="watermark"
  class:editing={editing}
  style="position: absolute; left: {pos.x}px; top: {pos.y}px;"
  on:mousedown={onMouseDown}
>
  {text}
</div>

<style lang="scss">
  .watermark {
    font-size: 24px;
    font-weight: bold;
    color: white;
    user-select: none;
    cursor: default;
    transition: transform 0.1s ease;

    &.editing {
      color: #55ffff;
      cursor: move;
      outline: 2px dashed rgba(85, 255, 255, 0.5);
      padding: 4px;
      border-radius: 4px;
    }
  }
</style>
