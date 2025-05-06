
import { writable } from 'svelte/store';

export const blockCount = writable<number | undefined>(undefined);

export const armorValue = writable<number | null>(null);
export const armorThreshold = 4;
