import { writable } from 'svelte/store';

export const notificationMessage = writable(null);

export function notify(html, duration = 4000, showLookPhone = false) {
	notificationMessage.set({ html, duration, showLookPhone });
}
