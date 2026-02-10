import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode, nick, bust, time, dmg, def, life } = await request.json();

	if (!sessionId || !playerCode || !nick || !bust) {
		return json({ error: 'missing_fields' }, { status: 400 });
	}

	const playerColumn = playerCode === 'code_1' ? 'player_1' : 'player_2';
	const otherPlayerColumn = playerCode === 'code_1' ? 'player_2' : 'player_1';

	// First, get the current session to check other player's status
	const { data: currentSession } = await supabaseAdmin
		.from('sessions')
		.select('*')
		.eq('id', sessionId)
		.single();

	const otherPlayer = currentSession?.[otherPlayerColumn];
	const otherPlayerReady = otherPlayer?.nick && otherPlayer?.bust;

	// Build update object
	const updateData = {
		[playerColumn]: { nick, bust, time, dmg, def, life }
	};

	// If other player is ready, update status to 2-onboarding
	if (otherPlayerReady) {
		updateData.status = '2-onboarding';
	}

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.update(updateData)
		.eq('id', sessionId)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ session: data });
}
