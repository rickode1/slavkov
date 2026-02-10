import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Persist sessionId to localStorage
function createPersistedStore(key, initialValue) {
	const storedValue = browser ? localStorage.getItem(key) : null;
	const store = writable(storedValue ? JSON.parse(storedValue) : initialValue);

	if (browser) {
		store.subscribe((value) => {
			if (value !== null) {
				localStorage.setItem(key, JSON.stringify(value));
			} else {
				localStorage.removeItem(key);
			}
		});
	}

	return store;
}

export const sessionId = createPersistedStore('sessionId', null);
export const gameSession = writable(null);
export const playerCode = createPersistedStore('playerCode', null); // 'code_1' or 'code_2' (phone only)

export function resetSession() {
	sessionId.set(null);
	gameSession.set(null);
	playerCode.set(null);
}
