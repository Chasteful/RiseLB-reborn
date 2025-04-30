<script lang="ts">
    import CombinedStatus from "./CombinedStatus.svelte";
    import { listen } from "../../../../integration/ws";
    import type { PlayerData } from "../../../../integration/types";
    import { onMount } from "svelte";
    import { getPlayerData } from "../../../../integration/rest";
    import type { ClientPlayerDataEvent } from "../../../../integration/events";

    let playerData: PlayerData | null = null;

    // 新增响应式血量文本计算
    $: healthText = playerData ? 
      `${playerData.health}${playerData.absorption > 0 ? `+${playerData.absorption}` : ''}/${playerData.maxHealth}` 
      : '0/0';

    // 更新playerData并刷新 maxAbsorption
    function updatePlayerData(s: PlayerData) {
        playerData = s;
    }

    listen("clientPlayerData", (event: ClientPlayerDataEvent) => {
        updatePlayerData(event.playerData);
    });

    onMount(async () => {
        updatePlayerData(await getPlayerData());
    });
</script>
{#if playerData && playerData.gameMode !== "spectator"}
    <div class="hotbar">
        {#if playerData.gameMode !== "creative"}
            <!-- 整合后的血条区域 -->
            <div class="status-container">
                <div class="status-row-group">
                    <div class="level-stat">
                        Lv. {playerData.experienceLevel}
                    </div>
                    
                    <CombinedStatus 
                        health={playerData.health}
                        absorption={playerData.absorption}
                        max={playerData.maxHealth}
                        
                    />
                </div>
            </div>
        {/if}
    </div>
{/if}

<style lang="scss">
    @use "../../../../colors.scss" as *;
    
    .status-container {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: center;
        margin-bottom: 6px;
    }
    
    .status-row-group {
        display: flex;
        align-items: center;
        position: relative;
        gap: 12px;
    }
    
    .level-stat {
        position: absolute;
        left: -70px; 
        font-size: 14px;
        font-weight: bold;
        color: rgba(255, 255, 255, 0.85);
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.6);
        font-family: 'Inter', system-ui, sans-serif;
        white-space: nowrap;
    }
</style>