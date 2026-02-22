import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId } = await request.json();

	if (!sessionId) {
		return json({ error: 'missing_fields' }, { status: 400 });
	}

	const { data: session, error: fetchError } = await supabaseAdmin
		.from('sessions')
		.select('*')
		.eq('id', sessionId)
		.single();

	if (fetchError || !session) {
		return json({ error: 'session_not_found' }, { status: 404 });
	}

	const currentRound = session.current_round || 1;
	const currentRoundData = session[`round_${currentRound}`] || {};
	const roundWinner = currentRoundData.winner;

	if (!roundWinner) {
		return json({ error: 'no_winner_for_current_round' }, { status: 400 });
	}

	const loser = roundWinner === 1 ? 2 : 1;
	const nextRound = currentRound + 1;

	// No more rounds — game over
	if (nextRound > 3) {
		const { data, error } = await supabaseAdmin
			.from('sessions')
			.update({ status: '8-gameend' })
			.eq('id', sessionId)
			.select()
			.single();

		if (error) {
			return json({ error: error.message }, { status: 500 });
		}

		return json({ ok: true, session: data, gameEnd: true });
	}

	const nextRoundColumn = `round_${nextRound}`;
	const existingNextRound = session[nextRoundColumn] || {};

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.update({
			current_round: nextRound,
			status: '3-deployment',
			[nextRoundColumn]: {
				...existingNextRound,
				current_turn: {
					role: 'dmg',
					number: 0,
					player: loser,
				},
			},
		})
		.eq('id', sessionId)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ ok: true, session: data, nextRound, loser });
}
