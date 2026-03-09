import { get } from 'svelte/store';
import { supabase } from '$lib/supabaseClient.js';
import { sessionId } from '$lib/stores/gameSession.js';

let soundChannel = null;
let myTarget = null;

export function initSoundListener(target) {
	myTarget = target;
}

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

export async function playSound(file, target = 'all') {
	if (!soundChannel) return;
	await soundChannel.send({
		type: 'broadcast',
		event: 'play',
		payload: { file, target },
	});
}

function playAudio(file) {
	const audio = new Audio(`/sounds/${file}`);
	audio.play().catch((e) => console.warn('Sound playback failed:', e));
}
