import { type Writable, writable} from "svelte/store";
import type { Module } from "../../integration/types";

export interface TDescription {
  description: string;
  anchor: "left" | "right",
  x: number;
  y: number;
}
export const expandedModuleName = writable<string | null>(null);

export const activePanelId = writable<string | null>(null); 

export const resolutionScale = writable(1);

export const viewportOffset = writable({ x: 0, y: 0 });

export const description: Writable<TDescription | null> = writable(null);

export const isClickGuiOpen = writable(false);

export const maxPanelZIndex: Writable<number> = writable(0);

export const highlightModuleName: Writable<string | null> = writable(null);

export const scaleFactor: Writable<number> = writable(2);

export const showGrid: Writable<boolean> = writable(false);

export const snappingEnabled: Writable<boolean> = writable(true);

export const gridSize: Writable<number> = writable(10);

export const showResults = writable<boolean>(false);
 
export const filteredModules = writable<Module[]>([]);

export const showSearch = writable(false);
