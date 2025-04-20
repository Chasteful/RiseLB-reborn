<script lang="ts">
  import { listen } from "../../../integration/ws";
  import type { ClientPlayerDataEvent } from "../../../integration/events";
  import type { HUDComponentSettings, StatusEffect } from "../../../integration/types";
  import { fly } from "svelte/transition";
  import { expoOut } from "svelte/easing";
    // svelte-ignore export_let_unused
    export let settings: HUDComponentSettings;
    // svelte-ignore export_let_unused
export let editing: boolean;
  let effects: StatusEffect[] = [];

  listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
    effects = event.playerData.effects;
  });

  function formatTime(duration: number): string {
    return new Date(((duration / 20) | 0) * 1000)
      .toISOString()
      .substring(14, 19);
  }
</script>

<div class="effects">
  {#each effects as e}
    <div
      class="effect"
      transition:fly={{ duration: 700, y: 50, easing: expoOut }}
    >
      <span class="name" style="color: {'#' + e.color.toString(16)}"
        >{e.localizedName} {e.amplifier + 1}</span
      >
      <span class="duration">{formatTime(e.duration)}</span>
    </div>
  {/each}
</div>

<style lang="scss">
  @use "../../../colors.scss" as *;

  .effect {
    font-weight: 600;
    font-size: 14px;
    text-align: left;
    background-color: rgba($scoreboard-base-color,0.4);
    padding: 5px 8px;
    box-shadow:0px 0px 16px $base;
    text-shadow: 0px 0px 16px $base;

    //border: $border-thing;

    .duration {
      color: white;
    }
  }

  .effect:first-child {
    border-top-left-radius: 12px;
    border-top-right-radius: 12px;
  }

  .effect:last-child {
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
</style>
