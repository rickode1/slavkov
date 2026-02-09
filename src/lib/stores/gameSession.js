import { writable } from 'svelte/store';

// TV session stores
export const sessionId = writable(null);
export const gameSession = writable(null);

// Phone session stores
export const phoneSessionId = writable(null);
export const phoneSession = writable(null);
export const playerCode = writable(null);
