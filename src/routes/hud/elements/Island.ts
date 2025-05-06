
import { derived, writable } from 'svelte/store';
import type { TextComponent } from '../../../integration/types';

export const blockCount = writable<number | undefined>(undefined);
export let emptySlotCount = writable(27);
export const isInventoryFull = derived(emptySlotCount, $count => $count === 0);
export const armorValue = writable<number |undefined>(undefined);

export const armorThreshold = 4 ;
interface ArmorSlot {
    identifier: string;
    durability: number;
    maxDurability: number;
    displayName: string | TextComponent; 
  }
  export const armorDurabilityStore = writable<{
    helmet: ArmorSlot | null;
    chestplate: ArmorSlot | null;
    leggings: ArmorSlot | null;
    boots: ArmorSlot | null;
  }>({
    helmet: null,
    chestplate: null,
    leggings: null,
    boots: null
  });
  export const DURABILITY_RECOVERY= 0.15;
  export const DURABILITY_THRESHOLD = 0.1;