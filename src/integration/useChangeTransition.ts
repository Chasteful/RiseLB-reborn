import { tweened } from 'svelte/motion';
import { cubicOut } from 'svelte/easing';

export function useChangeTransition(from: number, to: number, duration = 450) {
  const value = tweened(from, { duration, easing: cubicOut });
  value.set(to);
  return value;
}
