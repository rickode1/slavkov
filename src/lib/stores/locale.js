import { writable } from 'svelte/store';
import { getLocale } from '$lib/paraglide/runtime';

// Reactive locale store — triggers Svelte re-renders when language changes
// without requiring a full page reload.
export const currentLocale = writable(getLocale());
