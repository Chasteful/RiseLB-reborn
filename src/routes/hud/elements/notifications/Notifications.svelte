<script lang="ts">
  import { listen } from "../../../../integration/ws";
  import Notification from "./Notification.svelte";
  import type { NotificationEvent } from "../../../../integration/events";
  import { Howl } from "howler";
  import { elasticOut, bounceOut } from "svelte/easing";
    import type { HUDComponentSettings } from "../../../../integration/types";
      // svelte-ignore export_let_unused
export let settings: HUDComponentSettings;
    // svelte-ignore export_let_unused
export let editing: boolean;
  interface TNotification {
    animationKey: number;
    id: number;
    title: string;
    severity: string;
    message: string;
    leaving?: boolean;
    remaining?: number;
  }

  let notifications: TNotification[] = [];

  const notification = new Howl({ src: ['audio/notifications/notification.mp3'], preload: true });
  const error = new Howl({ src: ['audio/notifications/error.mp3'], preload: true });
  const info = new Howl({ src: ['audio/notifications/info.mp3'], preload: true });
  const success = new Howl({ src: ['audio/notifications/success.ogg'], preload: true });

  function addNotification(title: string, message: string, severity: string) {
    let animationKey = Date.now();
    const id = animationKey;

    if (severity === "ENABLED" || severity === "DISABLED") {
      const index = notifications.findIndex(
        (n) => n.message === message && (n.severity === "ENABLED" || n.severity === "DISABLED")
      );
      if (index !== -1) {
        animationKey = notifications[index].animationKey;
        notifications.splice(index, 1);
      }
    }

    notifications = [
      { animationKey, id, title, message, severity },
      ...notifications,
    ];
    let remaining = 3.0;
    const newNote: TNotification = {
      animationKey,
      id,
      title,
      message,
      severity,
      remaining,
    };
    const interval = setInterval(() => {
      remaining = +(remaining - 0.1).toFixed(1);
      notifications = notifications.map(n =>
        n.id === id ? { ...n, remaining } : n
      );
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      notifications = notifications.map(n =>
        n.id === id ? { ...n, leaving: true } : n
      );
      setTimeout(() => {
        notifications = notifications.filter(n => n.id !== id);
      }, 300);
    }, 3000);
  }

  listen("notification", (e: NotificationEvent) => {
    addNotification(e.title, e.message, e.severity);

    switch (e.severity) {
      case "ERROR": error.play(); break;
      case "INFO": info.play(); break;
      case "SUCCESS": success.play(); break;
      default: notification.play(); break;
    }
  });

  function notificationFly(node: Element, { delay = 0, duration = 600 } = {}) {
    return {
      delay,
      duration,
      easing: elasticOut,
      css: (t: number, u: number) => `
        transform: 
          scale(${0.5 + 0.5 * t * t}) 
          translateY(${Math.sin(u * Math.PI) * 30}px)
          rotate(${(1 - t) * 8}deg);
        opacity: ${t * t};
        filter: drop-shadow(0 ${u * 10}px ${u * 20}px rgba(0,0,0,0.2));
      `
    };
  }
  function notificationOut(node: Element, { delay = 0, duration = 300 } = {}) {
  return {
    delay,
    duration,
    css: (t: number) => {
      // 使用单个缓动控制所有参数
      const eased = easeInBack(1 - t); // t从1→0时eased从0→1
      
      return `
        transform: 
          translateY(${eased * 100}px) 
          scale(${1 - eased * 0.5});
        opacity: ${1 - eased};
        transition-timing-function: cubic-bezier(0.68, -0.55, 0.27, 1.55);
        transform-origin: top center;
      `;
    }
  };
}

// 改良版回弹缓动函数
function easeInBack(t: number): number {
  const c1 = 1.5; // 控制回弹强度
  const c3 = c1 + 1;
  return c3 * t * t * t - c1 * t * t;
}

</script>

<div class="notifications">
  {#each notifications as { title, message, severity, animationKey, leaving, remaining } (animationKey)}
    <div
      in:notificationFly
      out:notificationOut
    >
      <Notification {title} {message} {severity} {remaining} />
    </div>
  {/each}
</div>
