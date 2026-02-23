import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode, debugRoll } = await request.json();

	if (!sessionId || !playerCode) {
		return json({ error: 'missing_fields' }, { status: 400 });
	}

	// Get current session
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
	const roundData = session[roundColumn] || {};
	const currentTurn = roundData.current_turn;

	if (!currentTurn) {
		return json({ error: 'no_active_turn' }, { status: 400 });
	}

	const expectedPlayer = playerCode === 'code_1' ? 1 : 2;
	if (currentTurn.player !== expectedPlayer) {
		return json({ error: 'not_your_turn' }, { status: 403 });
	}

	const turnNumber = currentTurn.number ?? 0;

	// Prevent re-rolling if already rolled this turn
	if (roundData.turns?.[turnNumber]?.roll != null) {
		return json({ error: 'already_rolled' }, { status: 409 });
	}

	// Calculate difficulty (same logic as client)
	const role = currentTurn.role || 'dmg';
	const playerSuffix = `_${currentTurn.player}`;
	let difficulty = role === 'def' ? 14 : 10;

	const locVal = roundData[`bonus_loc${playerSuffix}`] || 0;
	difficulty -= locVal;

	const bonusVal = roundData[`bonuses_${role}${playerSuffix}`] || 0;
	difficulty -= bonusVal;

	const roll = debugRoll || Math.floor(Math.random() * 20) + 1;
	const success = roll > difficulty;
	const hasUnitBonus = role === 'dmg' && (roundData[`bonus_unit${playerSuffix}`] || 0) > 0;

	const existingTurns = roundData.turns || {};

	// Only allow unit retry if the previous turn wasn't already a retry for this player
	const prevTurn = existingTurns[turnNumber - 1];
	const alreadyRetried = prevTurn && prevTurn.player === currentTurn.player && prevTurn.role === 'dmg' && prevTurn.unit_retry;
	const unitRetry = !success && hasUnitBonus && !alreadyRetried;

	const lifeSelected = roundData[`bonuses_life${playerSuffix}`] || 0;
	const lifeUsed = roundData[`life_used${playerSuffix}`] || 0;
	const hasLifeBonus = role === 'def' && (lifeSelected - lifeUsed) > 0;
	const lifeRetry = !success && hasLifeBonus;

	const turnData = {
		...(existingTurns[turnNumber] || {}),
		player: currentTurn.player,
		role: currentTurn.role,
		roll,
		difficulty,
	};

	if (unitRetry) {
		turnData.unit_retry = true;
	}

	if (lifeRetry) {
		turnData.life_retry = true;
	}

	const updatedRoundData = {
		...roundData,
		turns: {
			...existingTurns,
			[turnNumber]: turnData
		}
	};

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.update({ [roundColumn]: updatedRoundData })
		.eq('id', sessionId)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ session: data, roll });
}
