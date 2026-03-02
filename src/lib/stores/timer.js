import { writable } from 'svelte/store';

export const timerActive = writable(false);
export const timerRemaining = writable(30);

/** Start the timer (or restart it) with the given number of seconds. */
export function startTimer(seconds = 30) {
	timerRemaining.set(seconds);
	timerActive.set(true);
}

/** Stop (hide) the timer. */
export function stopTimer() {
	timerActive.set(false);
}

/** Reset the remaining time without stopping. Useful when moving to the next action. */
export function resetTimer(seconds = 30) {
	timerRemaining.set(seconds);
	timerActive.set(true);
}
