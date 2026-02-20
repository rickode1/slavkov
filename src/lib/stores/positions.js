import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient.js';

export const positions = writable([]);

let loaded = false;

export async function loadPositions() {
	if (loaded) return;

	const { data, error } = await supabase
		.from('positions')
		.select('*')
		.order('id');

	if (error) {
		console.error('Failed to load positions:', error);
		return;
	}

	positions.set(data.map((row) => ({
		id: row.id,
		label: row.label,
		x: row.x,
		y: row.y,
		zoomX: row.zoomX,
		zoomY: row.zoomY,
		mobileZoomP1X: row.mobileZoomP1X,
		mobileZoomP1Y: row.mobileZoomP1Y,
		mobileZoomP2X: row.mobileZoomP2X,
		mobileZoomP2Y: row.mobileZoomP2Y,
		slots: Object.entries(row.slots).map(([key, val]) => ({
			id: key,
			...val,
		})),
	})));

	loaded = true;
}
