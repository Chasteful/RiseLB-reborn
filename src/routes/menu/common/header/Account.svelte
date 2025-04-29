<script lang="ts">
  import ToolTip from "../ToolTip.svelte";
  import {getSession, openScreen} from "../../../../integration/rest";
  import {onMount} from "svelte";
  import {listen} from "../../../../integration/ws";
  import {location} from "svelte-spa-router";

  interface Session {
      username: string;
      avatar: string;
      premium: boolean;
  }

  let username = "";
  let avatar = "";
  let premium = true;
  let error: string | null = null;

  const inAccountManager = $location === "/altmanager";
  
  async function refreshSession() {
      try {
          const session: Session = await getSession();
          username = session.username;
          avatar = session.avatar;
          premium = session.premium;
          error = null;
      } catch (err) {
          error = "Failed to load session";
          console.error(err);
      }
  }

  function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" || e.key === " ") {
          openScreen("altmanager");
      }
  }

  onMount(async () => {
      await refreshSession();
  });

  listen("session", async () => {
      await refreshSession();
  });
</script>

<div 
  class="account"
  on:click={() => openScreen("altmanager")}
  on:keydown={handleKeyDown}
  role="button"
  tabindex="0"
  aria-label="Account information, click to change account"
>
  <object data={avatar} type="image/png" class="avatar" aria-label="avatar">
      <img src="img/steve.png" alt="Default avatar" class="avatar">
  </object>
  
  <div class="username">{username}</div>
  
  <div class="account-type">
      {#if premium}
          <span class="premium">Premium</span>
      {:else}
          <span class="offline">Offline</span>
      {/if}
  </div>
  
  <button 
      class="button-change-account" 
      disabled={inAccountManager} 
      type="button"
      aria-label="Change account"
  >
      <ToolTip text="Change account"/>
      <img class="icon" src="img/menu/icon-pen.svg" alt="">
  </button>
  
  {#if error}
      <div class="error-message" aria-live="polite">{error}</div>
  {/if}
</div>

<style lang="scss">
@import "../../../../colors";

.account {
  --account-premium-color: #{$menu-account-premium-color};
  --account-offline-color: #{$overlay0};
  --account-text-color: #{$text};
  --account-bg-color: rgba($base, 0.3);

  background-color: var(--account-bg-color);
  width: 488px;
  padding: 15px 18px;
  border-radius: 12px;
  align-items: center;
  display: grid;
  grid-template-areas:
      "a b c"
      "a d c";
  grid-template-columns: max-content 1fr max-content;
  column-gap: 15px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:focus-visible {
      outline: 2px solid var(--account-premium-color);
      outline-offset: 2px;
  }

  &:active {
      transform: scale(0.98);
  }
}

.avatar {
  height: 68px;
  width: 68px;
  border-radius: 50%;
  grid-area: a;
  object-fit: cover;
}

.username {
  font-weight: 600;
  color: var(--account-text-color);
  font-size: 20px;
  grid-area: b;
  align-self: flex-end;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.account-type {
  font-weight: 500;
  font-size: 20px;
  grid-area: d;
  align-self: flex-start;

  .premium {
    color: var(--account-premium-color);
  }

  .offline {
    color: var(--account-offline-color);
  }
}

.button-change-account {
  background-color: transparent;
  border: none;
  grid-area: c;
  position: relative;
  height: max-content;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  &:focus-visible {
    outline: 2px solid var(--account-premium-color);
  }
}

.error-message {
  color: red;
  font-size: 14px;
  grid-column: 1 / -1;
  text-align: center;
  margin-top: 8px;
}
</style>