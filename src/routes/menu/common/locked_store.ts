// src/stores/locked_store.ts
import { writable } from "svelte/store";

const initial = localStorage.getItem("unlocked") === "true" || localStorage.getItem("title_visited") === "true" ? false : true;
export const isEscPressed = writable(false);
export const locked = writable(initial);


export function unlock() {
  locked.set(false);
  isEscPressed.set(true);
  localStorage.setItem("unlocked", "true");
  localStorage.setItem("title_visited", "true");
}
