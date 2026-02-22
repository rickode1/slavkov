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

	// Pre-check: reject if other player already has the same bust
	if (otherPlayer?.bust && otherPlayer.bust === bust) {
		return json({ error: 'bust_taken' }, { status: 409 });
	}

	// Build update object
	const updateData = {
		[playerColumn]: { nick, bust, time, dmg, def, life }
	};

	// If other player is ready, update status and determine starting player
	if (otherPlayerReady) {
		updateData.status = '2-onboarding';

		// Calculate stat sums (dmg + def + life) for both players
		const currentStatSum = (dmg || 0) + (def || 0) + (life || 0);
		const otherStatSum = (otherPlayer.dmg || 0) + (otherPlayer.def || 0) + (otherPlayer.life || 0);

		// Weaker player (smaller sum) starts. If equal, compare time. If still equal, player 1 starts.
		const currentPlayerNumber = playerCode === 'code_1' ? 1 : 2;
		const otherPlayerNumber = playerCode === 'code_1' ? 2 : 1;

		let startingPlayer;
		if (currentStatSum !== otherStatSum) {
			startingPlayer = currentStatSum < otherStatSum ? currentPlayerNumber : otherPlayerNumber;
		} else {
			const currentTime = time || 0;
			const otherTime = otherPlayer.time || 0;
			if (currentTime !== otherTime) {
				startingPlayer = currentTime < otherTime ? currentPlayerNumber : otherPlayerNumber;
			} else {
				startingPlayer = 1;
			}
		}

		const existingRound1 = currentSession.round_1 || {};
		updateData.round_1 = { ...existingRound1, current_turn: { player: startingPlayer, role: 'dmg', number: 0 } };
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

	// Post-check: handle race condition where both players saved the same bust simultaneously
	const otherBust = data[otherPlayerColumn]?.bust;
	if (otherBust && otherBust === bust) {
		// Revert this player's profile
		await supabaseAdmin
			.from('sessions')
			.update({ [playerColumn]: null })
			.eq('id', sessionId);
		return json({ error: 'bust_taken' }, { status: 409 });
	}

	return json({ session: data });
}
