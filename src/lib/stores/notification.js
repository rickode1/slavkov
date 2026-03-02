import { writable } from 'svelte/store';

export const notificationMessage = writable(null);

export function notify(html) {
	notificationMessage.set(html);
}
