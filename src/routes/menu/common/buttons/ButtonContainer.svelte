<div class="button-container">
    <slot />
</div>

<style lang="scss">
    @use "../../../../colors.scss" as *;

    .button-container {
      background-color: rgba($base, 0.3);
      padding: 10px 24px;
      width: max-content;
      border-radius: 16px;
      display: flex;
      column-gap: 20px;
    }
</style>