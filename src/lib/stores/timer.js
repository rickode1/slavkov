import { writable } from 'svelte/store';

export const timerActive = writable(false);
export const timerRemaining = writable(60);

export function startTimer(seconds = 60) {
	timerRemaining.set(seconds);
	timerActive.set(true);
}

export function stopTimer() {
	timerActive.set(false);
}

export function resetTimer(seconds = 60) {
	timerRemaining.set(seconds);
	timerActive.set(true);
}
