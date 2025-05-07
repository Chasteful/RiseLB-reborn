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

export function lock() {
  locked.set(true);
  isEscPressed.set(false);
  localStorage.setItem("unlocked", "false");
  // Keep title_visited as true so it doesn't show the initial screen again
}