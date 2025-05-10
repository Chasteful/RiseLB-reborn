<script lang="ts">
    import ToolTip from "../../ToolTip.svelte";
    import {
        getAccounts,
        getSession,
        openScreen,
        loginToAccount,
        directLoginToCrackedAccount,
        randomUsername
    } from "../../../../../integration/rest";
    import {onMount} from "svelte";
    import {listen} from "../../../../../integration/ws";
    import {location} from "svelte-spa-router";
    import {quintOut} from "svelte/easing";
    import {fade, slide} from "svelte/transition";
    import type {Account} from "../../../../../integration/types";
    import Avatar from "./Avatar.svelte";
    import {notification} from "../notification_store";
    import type {AccountManagerAdditionEvent} from "../../../../../integration/events";
    import AddAccountModal from "../../../altmanager/addaccount/AddAccountModal.svelte";
    let username = "";
    let avatar = "";
    let premium = true;

    let expanded = false;
    let accountElement: HTMLElement;
    let headerElement: HTMLElement;

    let searchQuery = "";
    let accounts: Account[] = [];

    let addAccountModalVisible = false;
    $: renderedAccounts = accounts.filter(a => a.username.toLowerCase().includes(searchQuery.toLowerCase()) || searchQuery === "");

    const inAccountManager = $location === "/altmanager";

    async function refreshSession() {
        const session = await getSession();
        username = session.username;
        avatar = session.avatar;
        premium = session.premium;
    }

    async function refreshAccounts() {
        accounts = await getAccounts();
    }

    onMount(async () => {
        await refreshSession();
        await refreshAccounts();
    });

    listen("accountManagerAddition", (e: AccountManagerAdditionEvent) => {
        addAccountModalVisible = false;
        refreshAccounts();

        if (!e.error) {
            notification.set({
                title: "AltManager",
                message: `Successfully added account ${e.username}`,
                error: false
            });
        } else {
            notification.set({
                title: "AltManager",
                message: e.error,
                error: true
            });
        }
    });
    listen("session", async () => {
        await refreshSession();
    });

    listen("accountManagerRemoval", async () => {
        await refreshAccounts();
    });

    listen("accountManagerAddition", async () => {
        await refreshAccounts();
    });

    function handleWindowClick(e: MouseEvent) {
        if (!accountElement.contains(e.target as Node)) {
            expanded = false;
            searchQuery = "";
        }
    }

    function handleSelectClick(e: MouseEvent) {
        if (!expanded) {
            // Prevent icon buttons from opening quick switcher
            expanded = !(e.target as HTMLElement).classList.contains("icon");
        } else {
            expanded = !headerElement.contains(e.target as Node);
        }

        if (!expanded) {
            searchQuery = "";
        }
    }

    async function login(account: Account) {
        notification.set({
            title: "AltManager",
            message: "Logging in...",
            error: false
        });

        await loginToAccount(account.id);
    }

    async function loginWithRandomUsername() {
        const username = await randomUsername();
        await directLoginToCrackedAccount(username, false);
    }
</script>


<svelte:window on:click={handleWindowClick}/>
<AddAccountModal bind:visible={addAccountModalVisible}/>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="account-selector" class:expanded bind:this={accountElement} on:click={handleSelectClick}>
    <div class="selector-header" bind:this={headerElement}>
        <div class="avatar-container">
            <object data={avatar} type="image/png" class="avatar" aria-label="avatar">
                <img src="img/steve.png" alt="avatar" class="avatar">
            </object>
        </div>

        <div class="account-info">
            <div class="username">{username}</div>
            <div class="account-type">
                {#if premium}
                    <span class="premium-badge">Premium</span>
                {:else}
                    <span class="offline-badge">Offline</span>
                {/if}
            </div>
        </div>

        <div class="action-buttons">
            <button class="icon-button" type="button" on:click={loginWithRandomUsername}>
                <ToolTip text="Random username"/>

                <img class="icon" src="img/menu/account/icon-random.svg" alt="random username">
            </button>
            <button class="icon-button" disabled={inAccountManager} type="button"
                    on:click={() => openScreen("altmanager")}>
                <ToolTip text="Change account"/>

                <img class="icon" src="img/menu/icon-pen.svg" alt="change account">
            </button>
        </div>
    </div>

    {#if expanded}
        <div class="account-dropdown" transition:fade|global={{ duration: 150, easing: quintOut }}>
            <div class="search-container" in:slide|global={{ duration: 150, easing: quintOut }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="search-icon">
                    <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
                    <path d="M21 21L17 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <input type="text" autofocus class="search-input" placeholder="Search accounts..." bind:value={searchQuery}>
            </div>

            <div class="account-list-container" in:slide|global={{ duration: 150, easing: quintOut, delay: 50 }}>
                {#if accounts.length > 0}
                    {#if renderedAccounts.length > 0}
                        <div class="account-list">
                            {#each renderedAccounts as a (a.id)}
                                <div on:click={() => login(a)} class="account-item"
                                     transition:slide|global={{ duration: 150, easing: quintOut }}
                                     class:active={a.username === username}>
                                    <Avatar url={a.avatar} />
                                    <div class="account-details">
                                        <div class="account-username">{a.username}</div>
                                        <div class="account-type">{a.type}</div>
                                    </div>
                                    {#if a.username === username}
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="check-icon">
                                            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="empty-state" transition:fade>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="empty-icon">
                                <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" stroke-width="2"/>
                                <path d="M7 10L12 13L17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            <div class="empty-text">No accounts found</div>
                        </div>
                    {/if}
                {:else}
                    <div class="empty-state" transition:fade>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" class="empty-icon">
                            <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="currentColor" stroke-width="2"/>
                            <path d="M19 21V19C19 17.3431 17.6569 16 16 16H8C6.34315 16 5 17.3431 5 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <div class="empty-text">No accounts added yet</div>
                        <button class="add-account-button" on:click={() => addAccountModalVisible = true}>
                            Add Account
                        </button>
                    </div>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
  @import "../../../../../colors";

  $border-radius: 12px;
  $transition-speed: 0.2s;
  $shadow: 0 8px 24px rgba(0, 0, 0, 0.12);

  .account-selector {
    width: 360px;
    position: relative;
    user-select: none;

    &.expanded {
      .selector-header {
        border-radius: $border-radius $border-radius 0 0;
        background: rgba($base, 0.8);
        box-shadow: $shadow;
      }
    }
  }

  .selector-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: rgba($base, 0.5);
    border-radius: $border-radius;
    transition: all $transition-speed ease;
    cursor: pointer;

    &:hover {
      background: rgba($base, 0.7);
    }
  }

  .avatar-container {
    position: relative;
    flex-shrink: 0;
  }

  .avatar {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(white, 0.1);
    transition: all $transition-speed ease;


  }


  .account-info {
    flex-grow: 1;
    min-width: 0;
  }

  .username {
    font-weight: 600;
    font-size: 20px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .account-type {
    margin-top: 2px;
    font-size: 16px;
  }

  .premium-badge {
    color: $menu-account-premium-color;
  }

  .offline-badge {
    color: $menu-account-offline-color;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .action-button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    color: rgba($text, 0.7);
    cursor: pointer;
    transition: all $transition-speed ease;

    &:hover {
      background: rgba($text, 0.1);
      color: $text;
    }

    &:disabled {
      opacity: 0.5;
      pointer-events: none;
    }
  }
  .icon-button {
    background-color: transparent;
    border: none;
    position: relative;
    height: max-content;
    cursor: pointer;
    display: flex;
    align-items: center;

    &:disabled {
      pointer-events: none;
      opacity: .5;
    }
  }


  .action-icon {
    width: 18px;
    height: 18px;
  }

  .account-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: rgba($base, 0.95);
    backdrop-filter: blur(12px);
    border-radius: 0 0 $border-radius $border-radius;
    overflow: hidden;
    box-shadow: $shadow;
    z-index: 1000;
  }

  .search-container {
    position: relative;
    padding: 12px 16px;
    border-bottom: 1px solid rgba($text, 0.1);
  }

  .search-icon {
    position: absolute;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba($text, 0.6);
  }

  .search-input {
    width: 100%;
    padding: 8px 16px 8px 40px;
    background: rgba($text, 0.05);
    border: none;
    border-radius: 6px;
    color: $text;
    font-size: 14px;
    transition: all $transition-speed ease;

    &:focus {
      outline: none;
      background: rgba($text, 0.1);
    }

    &::placeholder {
      color: rgba($text, 0.5);
    }
  }

  .account-list-container {
    max-height: 400px;
    overflow-y: auto;
    padding: 8px 0;
  }

  .account-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .account-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    cursor: pointer;
    transition: all $transition-speed ease;

    &:hover {
      background: rgba($text, 0.05);
    }

    &.active {
      background: rgba($text, 0.1);

      .account-username {
        color: $text;
        font-weight: 600;
      }
    }
  }

  .account-details {
    flex-grow: 1;
    min-width: 0;
  }

  .account-username {
    font-size: 14px;
    color: $text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .account-type {
    font-size: 12px;
    color: rgba($text, 0.6);
    margin-top: 2px;
  }

  .check-icon {
    flex-shrink: 0;
    color: $text;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 16px;
    text-align: center;
    color: rgba($text, 0.7);
  }

  .empty-icon {
    margin-bottom: 12px;
    color: rgba($text, 0.5);
  }

  .empty-text {
    font-size: 14px;
    margin-bottom: 16px;
  }

  .add-account-button {
    background: rgba($text, 0.1);
    color: $text;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all $transition-speed ease;

    &:hover {
      background: rgba($text, 0.2);
    }
  }
</style>
