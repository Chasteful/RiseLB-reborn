<script lang="ts">
  import {createEventDispatcher} from "svelte";

  export let title: string;
  export let icon: string;
  export let disabled = false;

  const dispatch = createEventDispatcher();
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<button class="icon-text-button" on:click={() => dispatch("click")} {disabled}>
  <div class="icon-container">
    <div class="icon">
      <img src="img/menu/{icon}" alt={title}>
    </div>
    <div class="title">{title}</div>
  </div>
</button>

<style lang="scss">
  @use "../../../../colors.scss" as *;

  .icon-text-button {
    --button-bg: rgba(0, 0, 0, 0.2);
    --button-border: rgba(255, 255, 255, 0.06);
    --button-text: #{$text};
    --button-icon-bg: rgba(255, 255, 255, 0.05);
    --button-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
    --button-highlight: 0 0 6px rgba(255, 255, 255, 0.05);
    --button-text-shadow: 0 0 3px rgba(0, 0, 0, 0.2);

    display: inline-flex;
    padding: 0;
    border-radius: 30px;
    background: var(--button-bg);
    border: 1px solid var(--button-border);
    backdrop-filter: blur(10px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.24);
    font-size: 24px;
    color: var(--button-text);
    transition: all 0.3s ease;
    overflow: hidden;
    height: 60px;
    width: 60px;
    margin: 4px 8px;

    &:not([disabled]):hover {
      width: 180px;
      transform: none;
      box-shadow: 0 10px 10px rgba(0, 0, 0, 0.24);
    }

    &[disabled] {
      opacity: 0.4;
      pointer-events: none;
    }

    .icon-container {
      display: flex;
      align-items: center;
      height: 100%;
      box-shadow: inset 0 4px 8px rgba(255, 255, 255, 0.03);
    }

    .icon {
      width: 60px;
      height: 60px;
      min-width: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--button-icon-bg);
      border-radius: 30px;
      transition: all 0.5s ease;

      img {
        width: 32px;
    height: 32px;
    object-fit: contain;
    display: block;
      }
    }

    .title {
      flex: 1;
      white-space: nowrap;
      text-shadow: var(--button-text-shadow);
      padding: 0 20px 0 10px;
      opacity: 0;
      font-family: '汉仪文黑-85W';
      transition: opacity 0.3s ease;
    }

    &:hover .title {
      opacity: 1;
    }
  }


</style>