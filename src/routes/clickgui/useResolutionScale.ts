import { get, writable } from "svelte/store";

export const resolutionScale = writable(1);
export const scaleFactor = writable(1);

export function calculateBaseScale() {
  const baseResolution = { width: 1920, height: 1080 };
  const widthRatio = window.innerWidth / baseResolution.width;
  const heightRatio = window.innerHeight / baseResolution.height;
  return Math.min(widthRatio, heightRatio);
}

export function updateScaleFactors(minecraftScaleFactor: number, clickGuiScaleFactor: number) {
  resolutionScale.set(calculateBaseScale());
  scaleFactor.set(minecraftScaleFactor * clickGuiScaleFactor * get(resolutionScale));
}

export function useResolutionScale(minecraftScaleFactor: number, clickGuiScaleFactor: number) {
  // Initial scale update on mount
  updateScaleFactors(minecraftScaleFactor, clickGuiScaleFactor);

  window.addEventListener("resize", () => {
    updateScaleFactors(minecraftScaleFactor, clickGuiScaleFactor); // Update on resize
  });

  return {
    resolutionScale,
    scaleFactor
  };
}
