<script lang="ts">
  import { notification, type TNotification } from "./notification_store";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";

  let activeNotification: TNotification | null = null;
  let visible = false;
  let timeoutId: ReturnType<typeof setTimeout>;
  let progress = tweened(100, { duration: 0, easing: cubicOut });

  notification.subscribe((v) => {
      if (!v) {
          visible = false;
          return;
      }

      activeNotification = v;
      visible = true;

      progress.set(100, { duration: 0 });
      progress.set(0, {
          duration: (v?.delay ?? 3) * 1000,
          easing: cubicOut,
      });

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
          visible = false;
      }, (v?.delay ?? 3) * 1000);
  });
</script>

<div class="dynamic-island">
  <div class="notification" class:error={activeNotification?.error}>
      <div class="icon">
          <img src="img/hud/notification/icon-info.svg" alt="info" />
      </div>
      <div class="text">
          {#if visible && activeNotification}
              <div class="title">{activeNotification.title}</div>
              <div class="message">{activeNotification.message}</div>
          {/if}
      </div>
      <div class="progress" style="width: {$progress}%;"></div>
  </div>
</div>

<style lang="scss">
@use "../../../../colors.scss" as *;

.dynamic-island {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}

.notification {
  position: relative;
  display: flex;
  align-items: center;
  background-color: rgba($base, 0.68);
  border-radius: 9999px;
  padding: 10px 20px;
  min-width: 350px;
  max-width: 90vw;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;

  &.error {
      background-color: rgba($menu-error-color, 0.9);
  }

  .icon {
      width: 50px;
      height: 50px;
      border-radius: 9999px;
      background-color: $accent;
      display: flex;
      align-items: center;
      justify-content: center;

      img {
          width: 24px;
          height: 24px;
      }
  }

  .text {
      display: flex;
      flex-direction: column;

      .title {
          color: $text;
          font-weight: 600;
          font-size: 16px;
      }

      .message {
          color: $overlay0;
          font-size: 14px;
      }
  }

  .progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 2px;
      background: white;
      border-radius: 1px;
      transition: width 0.3s ease;
  }
}
</style>
