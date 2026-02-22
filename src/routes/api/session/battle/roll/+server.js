import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode } = await request.json();

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

	const roll = Math.floor(Math.random() * 20) + 1;

	const existingTurns = roundData.turns || {};
	const updatedRoundData = {
		...roundData,
		turns: {
			...existingTurns,
			[turnNumber]: {
				...(existingTurns[turnNumber] || {}),
				player: currentTurn.player,
				role: currentTurn.role,
				roll,
			}
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
