import { writable } from 'svelte/store';

export const sessionId = writable(null);
export const gameSession = writable(null);
export const playerCode = writable(null);
export const deviceParam = writable(null);

export function resetSession() {
	sessionId.set(null);
	gameSession.set(null);
	playerCode.set(null);
	deviceParam.set(null);
}
