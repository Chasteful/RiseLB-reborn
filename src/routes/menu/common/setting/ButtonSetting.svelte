<script lang="ts">
    import {createEventDispatcher} from "svelte";
    import CircleLoader from "../CircleLoader.svelte";

    export let title: string;
    export let disabled = false;
    export let secondary = false;
    export let inset = false;
    export let listenForEnter = false;
    export let loading = false;

    const dispatch = createEventDispatcher();

    function handleKeyDown(e: KeyboardEvent) {
        if (!listenForEnter) {
            return;
        }
        if (e.key === "Enter") {
            dispatch("click");
        }
    }
</script>

<svelte:window on:keydown={handleKeyDown}/>
<button class="button-setting" class:inset type="button" on:click={() => dispatch("click")} {disabled} class:secondary>
  {#if loading}
      <CircleLoader/>
  {/if}
  {title}
</button>

<style lang="scss">
  @use "sass:color";
  @use "../../../../colors.scss" as *;

.button-setting {
  position: relative;
  color: $text;
  font-family: "Inter", sans-serif;
  font-weight: 900;
  padding: 20px;
  border: none;
  border-radius: 12px;
  font-size: 20px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(12px);
  transition: all 0.25s ease-in-out;
  box-shadow: 0 6px 16px rgba(138, 180, 248, 0.2);

  &.inset {
    margin: 0 30px;
  }

  &.secondary {
    background: rgba(255, 255, 255, 0.04);
    color: $text;
  }

  &:not([disabled]):hover {
    background: rgba(138, 180, 248, 0.18); 
    box-shadow: 0 6px 16px rgba(138, 180, 248, 0.2);

    &.secondary {
      background: rgba(255, 255, 255, 0.08);
      color: $text;
    }
  }

  &[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

</style>