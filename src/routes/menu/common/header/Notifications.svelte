<script lang="ts"> 
    import { notification, type TNotification } from "./notification_store";
    import { tweened, spring } from "svelte/motion";
    import { cubicOut, elasticOut } from "svelte/easing";
    import { onMount } from "svelte";
    import { get } from "svelte/store";
  
    
    let activeNotification: TNotification | null = null;
    let visible = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    
    const progress = tweened(100, { duration: 0, easing: cubicOut });
    const islandWidth = spring(60, { stiffness: 0.1, damping: 0.5 });
    const islandHeight = spring(60, { stiffness: 0.1, damping: 0.5 });
    const borderRadius = spring(30, { stiffness: 0.1, damping: 0.5 });
    const opacity = tweened(0, { duration: 200 });
    const contentOpacity = tweened(0, { duration: 150 });
    const blurAmount = tweened(0, { duration: 200 });
  
    notification.subscribe((v) => {
      if (!v) {
    
        contentOpacity.set(0, { duration: 150 });
        setTimeout(() => {
          visible = false;
          islandWidth.set(60);
          islandHeight.set(60);
          borderRadius.set(30);
          setTimeout(() => opacity.set(0, { duration: 200 }), 200);
        }, 150);
        return;
      }
  
      activeNotification = v;
      visible = true;
      
 
      islandWidth.set(60, { hard: true });
      islandHeight.set(60, { hard: true });
      borderRadius.set(30, { hard: true });
      opacity.set(0, { duration: 0 });
      contentOpacity.set(0, { duration: 0 });
      blurAmount.set(0, { duration: 0 });
      
 
      opacity.set(1, { duration: 200 });
      setTimeout(() => {
        islandWidth.set(350);
        islandHeight.set(80);
        borderRadius.set(40);
        blurAmount.set(20, { duration: 300 });
      
        setTimeout(() => contentOpacity.set(1, { duration: 150 }), 100);
      }, 50);
  
   
      progress.set(100, { duration: 0 });
      progress.set(0, {
        duration: (v?.delay ?? 3) * 1000,
        easing: cubicOut,
      });
  
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        notification.set(null);
      }, (v?.delay ?? 3) * 1000);
    });
  
    onMount(() => {
      if (get(notification)) {
        notification.set(null);
      }
      return () => {
        clearTimeout(timeoutId);
      };
    });
  </script>
  
  <div class="dynamic-island" 
       style="width: {$islandWidth}px; 
              height: {$islandHeight}px; 
              border-radius: {$borderRadius}px; 
              opacity: {$opacity};
              backdrop-filter: blur({$blurAmount}px);
              -webkit-backdrop-filter: blur({$blurAmount}px);">
    
    <div class="notification" class:error={activeNotification?.error}>
      {#if visible && activeNotification}
        <div class="content" style="opacity: {$contentOpacity}">
          <div class="icon">
            {#if activeNotification.error}
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            {:else}
              <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
            {/if}
          </div>
          <div class="text">
            <div class="title">{activeNotification.title}</div>
            <div class="message">{activeNotification.message}</div>
          </div>
          <div class="progress" style="width: {$progress}%"></div>
        </div>
      {/if}
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
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
      will-change: width, height, border-radius, opacity, backdrop-filter;
      transition: opacity 0.2s ease-out;
    }
  
    .notification {
      position: relative;
      display: flex;
      align-items: center;
      background-color: rgba($base, 0.68);
      height: 100%;
      width: 100%;
      padding: 0 20px;
      box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.08);
      
      &.error {
        background-color: rgba($menu-error-color, 0.9);
      }
  
      .content {
        display: flex;
        align-items: center;
        width: 100%;
        gap: 12px;
        will-change: opacity;
      }
  
      .icon {
        width: 40px;
        height: 40px;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(255, 255, 255, 0.2);
        flex-shrink: 0;
        
        svg {
          width: 20px;
          height: 20px;
          color: white;
        }
      }
  
      .text {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        flex-grow: 1;
  
        .title {
          color: $text;
          font-weight: 600;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
  
        .message {
          color: $overlay0;
          font-size: 13px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
  
      .progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.5);
        border-radius: 9999px;
        margin: 0 20px;
        width: calc(100% - 40px);
        transform-origin: left center;
        will-change: width;
        transition: width 0.1s linear;
      }
    }
  </style>