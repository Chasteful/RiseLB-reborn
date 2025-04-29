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
  <div class="icon">
      <img src="img/menu/{icon}" alt={title}>
  </div>
  <div class="title">{title}</div>
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

      display: flex;
      align-items: center;
      padding: 8px 20px;
      border-radius: 14px;
      background: var(--button-bg);
      border: 1px solid var(--button-border);
      backdrop-filter: blur(10px);
      box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.03);
      font-size: 24px;
      color: var(--button-text);
      transition: all 0.2s ease;

      &:not([disabled]):hover {
          transform: translateY(-2px);
          box-shadow: var(--button-shadow), var(--button-highlight);
      }

      &[disabled] {
          opacity: 0.4;
          pointer-events: none;
      }

      .icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--button-icon-bg);
          border-radius: 8px;
          margin-right: 10px;

          img {
              width: 60%;
          }
      }

      .title {
          flex: 1;
          white-space: nowrap;
          text-shadow: var(--button-text-shadow);
      }
  }


  :global(.light-theme) .icon-text-button {
      --button-bg: rgba(255, 255, 255, 0.7);
      --button-border: rgba(0, 0, 0, 0.1);
      --button-text: #333;
      --button-icon-bg: rgba(0, 0, 0, 0.05);
      --button-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
      --button-highlight: 0 0 6px rgba(0, 0, 0, 0.05);
      --button-text-shadow: 0 0 3px rgba(255, 255, 255, 0.2);
  }

  :global(.dark-theme) .icon-text-button {
      --button-bg: rgba(0, 0, 0, 0.2);
      --button-border: rgba(255, 255, 255, 0.06);
      --button-text: #{$text};
      --button-icon-bg: rgba(255, 255, 255, 0.05);
      --button-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
      --button-highlight: 0 0 6px rgba(255, 255, 255, 0.05);
      --button-text-shadow: 0 0 3px rgba(0, 0, 0, 0.2);
  }
</style>