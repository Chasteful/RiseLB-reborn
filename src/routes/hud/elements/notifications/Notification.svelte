<script lang="ts"> 
  import { fade } from "svelte/transition";
  // svelte-ignore export_let_unused
  export let title: string;
  export let message: string;
  export let severity: string;
  export let remaining: number = 3;

  $: subtitle =
    severity === 'ENABLED' ? `${message} has been enabled! (${remaining.toFixed(1)}s)` :
    severity === 'DISABLED' ? `${message} has been disabled! (${remaining.toFixed(1)}s)` :
    message;

</script>
<div class="notification {severity.toLowerCase()}" >
  <div class="icon-container">
    <div class="icon {severity.toLowerCase()}"></div>
    {#if ['ENABLED','DISABLED'].includes(severity)}
    {#key `${title}-${severity}-${remaining.toFixed(1)}`}
    <div class="toggle-indicator"></div>
  {/key}
    {/if}
  </div>
  <div class="content">
    <h3 class="title">{severity}</h3> 
    <p class="message">{subtitle}</p> 
    {#if ['ENABLED','DISABLED','SUCCESS','ERROR','INFO'].includes(severity)}
      <div class="progress-container">
        <!-- svelte-ignore element_invalid_self_closing_tag -->
        <div
          class="progress-bar {severity.toLowerCase()}"
          style="width: {(remaining / 3) * 100}%;"
        />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../../../colors.scss";
.notification {
  --accent-color: #{$accent-color};
  --success-color: #{mix($green, $text, 70%)};
  --error-color: #{mix($red, $text, 70%)};
  --info-color: #{mix($blue, $text, 70%)};
    display: flex;
    align-items: center;
    gap: 12px;
    background: linear-gradient(
      135deg,
      rgba(20,20, 20, 0.5) 0%,
      rgba(darken($base, 5%), 0.5) 100%
    );
    border-radius: 14px;
    width: 350px;
    padding: 16px;
    margin-bottom: 12px;
    border-left: 4px solid var(--accent-color);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 
      0 4px 24px rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(255, 255, 255, 0.03) inset;
    position: relative;
    overflow: hidden;
    color: rgba($text, 0.9);
    will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
  .notification::before {
    content: "";
    position: absolute;
    overflow: hidden; 
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
    opacity: 0.3;
    mix-blend-mode: overlay;
    z-index: 0;
    border-radius: inherit;
}
  &.success {
    --accent-color: var(--success-color);
    box-shadow: 0 12px 24px rgba($green, 0.4);
  }
  &.error {
    --accent-color: var(--error-color);
    box-shadow: 0 12px 24px rgba($red, 0.4);
  }
  &.info {
    --accent-color: var(--info-color);
    box-shadow: 0 12px 24px rgba($blue, 0.4);
  }
  &.enabled {
    --accent-color: var(--success-color);
    border-left-color: var(--success-color);
    box-shadow: 0 12px 24px rgba($green, 0.4);
  }
  &.disabled {
    --accent-color: var(--error-color);
    border-left-color: var(--error-color);
    box-shadow: 0 12px 24px rgba($red, 0.4);
  }
}
.icon-container {
  position: relative;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
}
.icon {
  width: 100%;
  height: 100%;
  background-position: center;
  background-repeat: no-repeat;
  background-size: 24px;
  border-radius: 12px;
  transition: all 0.3s ease;
  &.success {
    background-image: url("/img/hud/notification/icon-success.svg");
    background-color: rgba($green, 0.12);
  }
  &.error {
    background-image: url("/img/hud/notification/icon-error.svg");
    background-color: rgba($red, 0.12);
  }
  &.info {
    background-image: url("/img/hud/notification/icon-info.svg");
    background-color: rgba($blue, 0.12);
  }
  &.double {
    background-image: url("/img/hud/notification/icon-double.svg");
    background-color: rgba($accent-color-2, 0.12);
  }
  &.enabled, &.disabled {
    background-image: url("/img/hud/notification/icon-toggle.svg");
    background-color: rgba(var(--accent-color), 0.12);
  }
}
.toggle-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
  transition: transform 0.3s ease, background 0.3s ease;
  .enabled & {
    background: $green;
    transform: translate(6px, -50%);
  }
  .disabled & {
    background: $red;
    transform: translate(-12px, -50%);
  }
}
.content {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 14px;
  font-weight: 600;
  color: $text;
  margin-bottom: 4px;
  line-height: 1.4;
}
.message {
  font-size: 13px;
  color: $subtext1;
  line-height: 1.5;
  white-space: pre-wrap;
}
.fade {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.fade.active {
  opacity: 1;
}
.progress-container {
  height: 4px;
  width: 100%;
  margin-top: 10px;
  background: rgba(20,20, 20, 0.08);
  border-radius: 2px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.1s linear;
  &.enabled {
    background: linear-gradient(90deg, mix($green,$text, 20%) 0%, $green 100%);
  }
  &.disabled {
    background: linear-gradient(90deg, mix($red, $text, 20%) 0%, $red 100%);
  }
  &.success {
    background: linear-gradient(90deg, mix($green, $text, 30%) 0%, $green 100%);
  }
  &.error {
    background: linear-gradient(90deg, mix($red, $text, 30%) 0%, $red 100%);
  }
  &.info {
    background: linear-gradient(90deg, mix($blue, $text, 30%) 0%, $blue 100%);
  }
}
</style>