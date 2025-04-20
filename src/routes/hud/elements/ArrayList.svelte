<script lang="ts">
    import { onMount, tick } from "svelte";
    import type { HUDComponentSettings, Module } from "../../../integration/types";
    import { getModules } from "../../../integration/rest";
    import { listen } from "../../../integration/ws";
    import { getTextWidth } from "../../../integration/text_measurement";
    import { flip } from "svelte/animate";
    import { fly } from "svelte/transition";
    import { convertToSpacedString, spaceSeperatedNames } from "../../../theme/theme_config";
    import { getPrefixAsync } from "../../../theme/arraylist";
    import { expoInOut } from "svelte/easing"; 
         export let settings: HUDComponentSettings;
         export let editing: boolean;
    let enabledModules: (Module & { prefix: string; formattedName: string; width: number })[] = [];

    let prefixs = new Map(); 


    async function updateEnabledModules() {
        const modules = await getModules();
        const visibleModules = modules.filter(m => m.enabled && !m.hidden);

        const modulesWithWidths = await Promise.all(visibleModules.map(async module => {
            const formattedName = $spaceSeperatedNames ? convertToSpacedString(module.name) : module.name;
            const prefix = await getPrefixAsync(module.name);
            prefixs.set(module.name, prefix);
            const font = "500 16px 'Product Sans'";
            const fullNameWithPrefix = `${formattedName} ${prefix}`;
            const width = getTextWidth(fullNameWithPrefix, font);

            return {
                ...module,
                formattedName,
                width,
                prefix
            };
        }));

  
enabledModules = modulesWithWidths.sort((a, b) => b.width - a.width);
    
        await tick();  
    }

    
    spaceSeperatedNames.subscribe(async () => {
        await updateEnabledModules();
    });


    onMount(async () => {
        await updateEnabledModules();
    });

   
    listen("moduleToggle", async () => {
        await updateEnabledModules();
    });

         listen("refreshArrayList", async () => {
        await updateEnabledModules();
    });
</script>

<div class="arraylist" id="arraylist" transition:fly|global={{duration: 500, y: -50, easing: expoInOut}}>
    {#each enabledModules as { formattedName, prefix, name } (name)}
    <div class="module" id="module-name" animate:flip={{ duration: 200 }} in:fly={{ x: 50, duration: 200 }}>
        {formattedName}
        <span class="prefix">{prefix}</span>
        <span class="side-bar" id="side-bar"></span>
    </div>
{/each}
</div>


<style lang="scss">
    @import "../../../colors.scss";

    :root {
        --accent-color: #{$accent-color};
        --accent-color-2: #{$accent-color-2};
    }

    .arraylist {
        position: fixed;
        top: 10px;
        right: 10px;
        transform: translateZ(0);
        will-change: transform;
        font-size: 72px;
    }
    
    .module {
        position: relative;
        display: flex;
  align-items: center;
  padding-right: 24px;    background-color: rgba(0, 0, 0, 0.2);    border-radius: 3px;
        box-shadow: 
  -10px 0px 20px rgba(0, 0, 0, 0.15),
   10px 0px 20px rgba(0, 0, 0, 0.15); 
  color: var(--accent-color);
  text-shadow:var(--accent-color);
  font-family: 'Product Sans', system-ui, -apple-system, sans-serif;
  font-size: 16px;
  padding: 2px 6px;
  width: max-content;
  font-weight: 500; 
  margin-left: auto;
  text-transform: capitalize;
  

  position: relative;
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    z-index: -1;
  }
  



&:first-child {
    border-radius: 3px 3px 0 0;
    &::after {
      border-radius: 3px 3px 0 0;
    }
  }

  &:last-child {
    border-radius: 0 0 3px 3px;
    &::after {
      border-radius: 0 0 3px 3px;
    }
  }
}


    .prefix {
        color: #AAAAAA;
        text-shadow: 0 0 3px rgba(#AAAAAA,0.9);
        margin-left: 6px; 
    }
    .side-bar {
        position: absolute;
  right: -3px;    top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: calc(100% - 6px);    background-color: currentColor;
  border-radius: 2px;
  box-shadow: 0 0 5px currentColor;
  pointer-events: none;
}


</style>