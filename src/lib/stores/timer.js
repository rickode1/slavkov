import { writable } from 'svelte/store';

export const timerActive = writable(false);
export const timerRemaining = writable(0);
