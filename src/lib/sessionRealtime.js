import { supabase } from '$lib/supabaseClient.js';
import { gameSession } from '$lib/stores/gameSession.js';

let channel = null;

export function subscribeToSession(id) {
	// Clean up previous channel
	if (channel) {
		supabase.removeChannel(channel);
		channel = null;
	}

	if (id) {
		// Fetch initial session data
		supabase
			.from('sessions')
			.select('*')
			.eq('id', id)
			.single()
			.then(({ data }) => {
				gameSession.set(data);
			});

		// Subscribe to realtime updates
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
					gameSession.set(payload.new);
				}
			)
			.subscribe();
	}
}

export function cleanupSession() {
	if (channel) {
		supabase.removeChannel(channel);
		channel = null;
	}
}
