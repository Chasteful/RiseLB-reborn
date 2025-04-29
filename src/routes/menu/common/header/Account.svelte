<script lang="ts">
  
  import ToolTip from "../ToolTip.svelte";
  import {getSession, openScreen} from "../../../../integration/rest";
  import {onMount} from "svelte";
  import {listen} from "../../../../integration/ws";
  import {location} from "svelte-spa-router";

  let username = "";
  let avatar = "";
  let premium = true;

  const inAccountManager = $location === "/altmanager";
  
  async function refreshSession() {
      const session = await getSession();
      username = session.username;
      avatar = session.avatar;
      premium = session.premium;
  }

  onMount(async () => {
      await refreshSession();
  });

  listen("session", async () => {
      await refreshSession();
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="account" on:click={() => openScreen("altmanager")}>
  <object data={avatar} type="image/png" class="avatar" aria-label="avatar">
      <img src="img/steve.png" alt="avatar" class="avatar">
  </object>
  <div class="username">{username}</div>
  <div class="account-type">
      {#if premium}
          <span class="premium">Premium</span>
      {:else}
          <span class="offline">Offline</span>
      {/if}
  </div>
  <button class="button-change-account" >
      <ToolTip text="Change account"/>
      <img class="icon" src="img/menu/icon-pen.svg" alt="change account">
  </button>
</div>

<style lang="scss">
@import "../../../../colors";

.account {
  width: 488px;
  padding: 15px 18px;
  border-radius: 5px;
  align-items: center;
  display: grid;
  grid-template-areas:
      "a b c"
      "a d c";
  grid-template-columns: max-content 1fr max-content;
  column-gap: 15px;
  background-color: transparent;
  transition: all 0.3s ease;
}

.avatar {
  height: 68px;
  width: 68px;
  border-radius: 50%;
  grid-area: a;
  object-fit: cover;
  border: 2px solid transparent;
  transition: border-color 0.3s ease, transform 0.2s ease;
}

.username {
  font-weight: 600;
  font-size: 20px;
  display: inline-block; 
  position: relative;
  color: $text;
  text-shadow:0 6px 12px rgba(0, 0, 0, 0.2);
}


.account-type {
  font-weight: 500;
  font-size: 20px;
  grid-area: d;
  align-self: flex-start;

  .premium {
    color: $menu-account-premium-color;
  }
}

.button-change-account {
  background-color: transparent;
  border: none;
  grid-area: c;
  position: relative;
  height: max-content;
  cursor: pointer;
  transition: opacity 0.3s ease;
  
  &:disabled {
    pointer-events: none;
    opacity: 0.5;
  }
  
  .icon {
    transition: filter 0.3s ease;
  }
}
</style>