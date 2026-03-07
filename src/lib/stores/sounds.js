import { get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient.js';
import { sessionId } from '$lib/stores/gameSession.js';

let soundChannel = null;

/** This device's role: 'tv' | 'player_1' | 'player_2' */
let myTarget = null;

/**
 * Register which role this device plays.
 * Call once per layout before subscribeSoundChannel().
 * @param {'tv'|'player_1'|'player_2'} target
 */
export function initSoundListener(target) {
	myTarget = target;
}

/**
 * Open the broadcast channel for the given session.
 * Re-call whenever sessionId changes (mirrors subscribeToSession pattern).
 * @param {string} id
 */
export function subscribeSoundChannel(id) {
	if (soundChannel) {
		supabase.removeChannel(soundChannel);
		soundChannel = null;
	}

	if (!id) return;

	soundChannel = supabase
		.channel(`sounds-${id}`)
		.on('broadcast', { event: 'play' }, ({ payload }) => {
			if (myTarget && (
				payload.target === myTarget ||
				payload.target === 'all' ||
				(payload.target === 'phones' && (myTarget === 'player_1' || myTarget === 'player_2'))
			)) {
				playAudio(payload.file);
			}
		})
		.subscribe();
}

export function cleanupSoundChannel() {
	if (soundChannel) {
		supabase.removeChannel(soundChannel);
		soundChannel = null;
	}
}

/**
 * Broadcast a sound to one or all devices.
 * @param {string} file  filename inside /static/sounds/, e.g. 'win.mp3'
 * @param {'tv'|'player_1'|'player_2'|'all'} target
 */
export async function playSound(file, target = 'all') {
	if (!soundChannel) return;
	await soundChannel.send({
		type: 'broadcast',
		event: 'play',
		payload: { file, target },
	});
}

/** Actually play the audio locally. */
function playAudio(file) {
	const audio = new Audio(`/sounds/${file}`);
	audio.play().catch((e) => console.warn('Sound playback failed:', e));
}
