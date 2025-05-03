import { writable } from 'svelte/store';


const getStoredLogo = (): number => {
  if (typeof window === 'undefined') return 1; 
  
  const stored = localStorage.getItem('lb-current-logo');
  return stored ? parseInt(stored) : 1;
};

export const currentLogo = writable(getStoredLogo());
export const logoVariants = 2;

if (typeof window !== 'undefined') {
  currentLogo.subscribe(val => {
    localStorage.setItem('lb-current-logo', val.toString());
  });
}