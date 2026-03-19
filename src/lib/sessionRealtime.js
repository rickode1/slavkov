import { supabase } from '$lib/supabaseClient.js';
import { gameSession } from '$lib/stores/gameSession.js';

let channel = null;
let currentSessionId = null;

export async function subscribeToSession(id) {
	currentSessionId = id;

	// Clean up previous channel first
	if (channel) {
		await supabase.removeChannel(channel);
		channel = null;
	}

	if (!id) {
		gameSession.set(null);
		return;
	}

	channel = supabase
		.channel(`session-${id}`)
		.on(
			'postgres_changes',
			{
				event: '*',
				schema: 'public',
				table: 'sessions',
				filter: `id=eq.${id}`
			},
			(payload) => {
				// payload.new is empty on DELETE, so guard it
				if (payload.eventType === 'DELETE') {
					gameSession.set(null);
				} else {
					gameSession.set(payload.new);
				}
			}
		)
		.subscribe(async (status) => {
			console.log('Realtime status:', status);

			if (status === 'SUBSCRIBED' && currentSessionId === id) {
				const { data, error } = await supabase
					.from('sessions')
					.select('*')
					.eq('id', id)
					.single();

				if (!error && data && currentSessionId === id) {
					gameSession.set(data);
				}
			} else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
				console.warn('Realtime disconnected:', status, '— reconnecting in 2s');
				setTimeout(() => {
					if (currentSessionId === id) {
						subscribeToSession(id);
					}
				}, 1000);
			}
		});
}

export async function refreshSession() {
	if (!currentSessionId || !channel) return;

	if (channel.state === 'joined') {
		const { data, error } = await supabase
			.from('sessions')
			.select('*')
			.eq('id', currentSessionId)
			.single();
		if (!error && data) gameSession.set(data);
	} else {
		subscribeToSession(currentSessionId);
	}
}

export async function cleanupSession() {
	currentSessionId = null;

	if (channel) {
		await supabase.removeChannel(channel);
		channel = null;
	}
}