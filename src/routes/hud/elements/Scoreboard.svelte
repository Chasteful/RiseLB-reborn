<script lang="ts">
    import {listen} from "../../../integration/ws";
    import type {HUDComponentSettings, PlayerData, Scoreboard} from "../../../integration/types";
    import TextComponent from "../../menu/common/TextComponent.svelte";
    import type {ClientPlayerDataEvent} from "../../../integration/events";
    // svelte-ignore export_let_unused
    export let settings: HUDComponentSettings;
    // svelte-ignore export_let_unused
export let editing: boolean;
    let scoreboard: Scoreboard | null = null;

    listen("clientPlayerData", (e: ClientPlayerDataEvent) => {
        const playerData: PlayerData = e.playerData;
        scoreboard = playerData.scoreboard;
    });
</script>

{#if scoreboard}
    <div class="scoreboard">
        {#if scoreboard.header}
            <div class="header">
              <TextComponent fontSize={16} allowPreformatting={true} textComponent={scoreboard.header}/>
            </div>
        {/if}
        <div class="entries">
            {#each scoreboard.entries as {name, score}}
                <div class="row">
                    <TextComponent fontSize={14} allowPreformatting={true} textComponent={name}/>
                </div>
            {/each}
        </div>
    </div>
{/if}

<style lang="scss">
  @import "../../../colors.scss";

  .scoreboard {
    min-width: 200px;
    //position: fixed;
    //left: 15px;
    //top: 550px;
    border-radius: 16px;
    overflow: hidden;
    z-index: -1;
    font-size: 14px;
    box-shadow: 0px 0px 4px 4px rgba(0,0,0,0.4);
  }

  .entries {
    background-color: rgba($scoreboard-base-color, 0.4);
    padding: 10px;
  }

  .row {
    display: flex;
    column-gap: 15px;
    justify-content: space-between;
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba($scoreboard-base-color, 0.4);
    padding: 10px;
    color: $accent-color;
    text-shadow: $accent-color 0px 0px 16px;
    font-size: 16px;
    text-align: center;
  }
  
</style>