<script lang="ts">
  import MainButton from "./buttons/MainButton.svelte";
  import ButtonContainer from "../common/buttons/ButtonContainer.svelte";
  import IconTextButton from "../common/buttons/IconTextButton.svelte";
  import IconButton from "../common/buttons/IconButton.svelte";
  import { browse, getClientUpdate, openScreen } from "../../../integration/rest";
  import { locked, unlock } from "../common/locked_store";
  import LockScreen from '../../../components/LockSreen.svelte';
  import Menu from "../common/Menu.svelte";
  import { fly } from "svelte/transition";
  import { onMount } from "svelte";
  import { notification } from "../common/header/notification_store";

  let regularButtonsShown = true;
  let clientButtonsShown = false;
  let isEscPressed = false;  // 用来标记 Esc 键是否按下

  // 用来记录 Esc 键按下的次数和时间
  let escPressedCount = 0;
  let lastPressedTime = 0;
  const ESC_PRESS_THRESHOLD = 500; // 设置最大时间间隔为 500ms (0.5 秒)
  
  // 按键事件监听
  function handleEscKey(event: KeyboardEvent) {
    if (event.key === "Escape") {
      const currentTime = Date.now();

      // 如果是第一次按下 Esc 键，记录时间
      if (escPressedCount === 0) {
        escPressedCount++;
        lastPressedTime = currentTime;
      } else if (escPressedCount === 1 && currentTime - lastPressedTime <= ESC_PRESS_THRESHOLD) {
        // 如果第二次按下 Esc 键，并且时间间隔在阈值内
        isEscPressed = true;  // 设置标记为 Esc 按下
        unlock(); // 解锁
        escPressedCount = 0; // 重置计数
      } else {
        // 如果按键间隔过长，重置计数
        escPressedCount = 1;
        lastPressedTime = currentTime;
      }
    }
  }

  // 监听按键事件
  onMount(() => {
    window.addEventListener('keydown', handleEscKey);

    // 标记页面访问
    localStorage.setItem("title_visited", "true");

    setTimeout(async () => {
      const clientUpdate = await getClientUpdate();
      if (clientUpdate.update) {
        notification.set({
          title: `LiquidBounce ${clientUpdate.update.clientVersion} has been released!`,
          message: `Download it from liquidbounce.net!`,
          error: false,
          delay: 99999999
        });
      }
    }, 2000);

    return () => {
      window.removeEventListener('keydown', handleEscKey); // 清理监听器
    };
  });

  function toggleButtons() {
    if (clientButtonsShown) {
      clientButtonsShown = false;
      setTimeout(() => regularButtonsShown = true, 750);
    } else {
      regularButtonsShown = false;
      setTimeout(() => clientButtonsShown = true, 750);
    }
  }

  function handleUnlock() {
    unlock();
  }
</script>

{#if $locked && !isEscPressed} <!-- 只有当 isEscPressed 为 false 时才显示 LockScreen -->
  <LockScreen on:loginSuccess={handleUnlock} />
{:else}
  <Menu>
    <div class="content">
      <div class="main-buttons">
        {#if regularButtonsShown}
          <MainButton title="Singleplayer" icon="singleplayer" index={0} on:click={() => openScreen("singleplayer")} />
          <MainButton title="Multiplayer" icon="multiplayer" index={1} on:click={() => openScreen("multiplayer")} />
          <MainButton title="LiquidBounce" icon="liquidbounce" index={2} on:click={toggleButtons} />
          <MainButton title="Options" icon="options" index={3} on:click={() => openScreen("options")} />
        {:else if clientButtonsShown}
          <MainButton title="Proxy Manager" icon="proxymanager" index={0} on:click={() => openScreen("proxymanager")} />
          <MainButton title="Click GUI" icon="clickgui" index={1} on:click={() => openScreen("clickgui")} />
          <MainButton title="Back" icon="back-large" index={2} on:click={toggleButtons} />
        {/if}
      </div>
      <div class="additional-buttons" transition:fly|global={{duration:300, y:100}}></div>
      <div class="social-buttons" transition:fly|global={{duration:300, y:100}}>
        <ButtonContainer>
          <IconButton title="Forum" icon="nodebb" on:click={() => browse("MAINTAINER_FORUM")} />
          <IconButton title="GitHub" icon="github" on:click={() => browse("MAINTAINER_GITHUB")} />
          <IconButton title="Discord" icon="discord" on:click={() => browse("MAINTAINER_DISCORD")} />
          <IconButton title="Twitter" icon="twitter" on:click={() => browse("MAINTAINER_TWITTER")} />
          <IconButton title="YouTube" icon="youtube" on:click={() => browse("MAINTAINER_YOUTUBE")} />
          <IconButton title="BiliBili" icon="bili" on:click={() => browse("MAINTAINER_BILIBILI")} />
          <IconTextButton title="DevLog" icon="icon-liquidbounce.net.svg" on:click={() => browse("CLIENT_WEBSITE")} />
        </ButtonContainer>
      </div>
    </div>
  </Menu>
{/if}

  
<style>
    .content {
        flex: 1;
        display: grid;
        grid-template-areas:
            "a ."
            "b c";
        grid-template-rows: 1fr max-content;
        grid-template-columns: 1fr max-content;
    }

    .main-buttons {
        display: flex;
        flex-direction: column;
        row-gap: 25px;
        grid-area: a;
    }

    .additional-buttons {
        grid-area: b;
    }

    .social-buttons {
        grid-area: c;
    }
</style>