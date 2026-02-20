import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode, bonuses } = await request.json();

	if (!sessionId || !playerCode || !bonuses) {
		return json({ error: 'missing_fields' }, { status: 400 });
	}

	// Get current session to determine the round
	const { data: session, error: fetchError } = await supabaseAdmin
		.from('sessions')
		.select('*')
		.eq('id', sessionId)
		.single();

	if (fetchError || !session) {
		return json({ error: 'session_not_found' }, { status: 404 });
	}

	const round = session.current_round;
	if (!round || round < 1 || round > 3) {
		return json({ error: 'invalid_round' }, { status: 400 });
	}

	const roundColumn = `round_${round}`;
	const suffix = playerCode === 'code_1' ? '_1' : '_2';

	// Merge with existing round data
	const existingRoundData = session[roundColumn] || {};
	const updatedRoundData = {
		...existingRoundData,
		[`bonuses_def${suffix}`]: bonuses.def || 0,
		[`bonuses_dmg${suffix}`]: bonuses.dmg || 0,
		[`bonuses_life${suffix}`]: bonuses.life || 0
	};

	// Check if both players have selected bonuses
	const otherSuffix = playerCode === 'code_1' ? '_2' : '_1';
	const otherHasBonuses = updatedRoundData[`bonuses_def${otherSuffix}`] !== undefined
		|| updatedRoundData[`bonuses_dmg${otherSuffix}`] !== undefined
		|| updatedRoundData[`bonuses_life${otherSuffix}`] !== undefined;

	const updateData = { [roundColumn]: updatedRoundData };
	if (otherHasBonuses) {
		updateData.status = '5-minigames';

		// Calculate minigame results based on starting_player
		const startingPlayer = updatedRoundData.starting_player || 1;
		const startingSuffix = `_${startingPlayer}`;
		const opponentSuffix = startingPlayer === 1 ? '_2' : '_1';

		// Starting player gets dmg minigame, opponent gets def minigame (50/50 chance each)
		updatedRoundData[`bonus_minigame_dmg${startingSuffix}`] = Math.random() < 0.5 ? 1 : 0;
		updatedRoundData[`bonus_minigame_def${opponentSuffix}`] = Math.random() < 0.5 ? 1 : 0;
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
