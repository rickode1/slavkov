import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, success } = await request.json();

	if (!sessionId || success == null) {
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

	const round = session.current_round;
	const roundColumn = `round_${round}`;
	const roundData = session[roundColumn] || {};
	const currentTurn = roundData.current_turn || {};

	const role = currentTurn.role || 'dmg';
	const player = currentTurn.player || 1;
	const turnNumber = currentTurn.number ?? 0;

	if (!success) {
		if (role === 'dmg') {
			// Check if this turn had unit_retry — give same player another dmg attempt
			const currentTurnData = roundData.turns?.[turnNumber] || {};
			const nextPlayer = currentTurnData.unit_retry ? player : (player === 1 ? 2 : 1);
			const updatedRoundData = {
				...roundData,
				current_turn: {
					player: nextPlayer,
					role: 'dmg',
					number: turnNumber + 1,
				},
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

			return json({ ok: true, next: 'turn', session: data });
		} else {
			// def failed — check for life bonus before ending round
			const currentTurnData = roundData.turns?.[turnNumber] || {};
			if (currentTurnData.life_retry) {
				// life bonus saves the defender — consume one life, defender becomes attacker
				const suffix = `_${player}`;
				const lifeUsed = (roundData[`life_used${suffix}`] || 0) + 1;
				const updatedRoundData = {
					...roundData,
					[`life_used${suffix}`]: lifeUsed,
					current_turn: {
						player,
						role: 'dmg',
						number: turnNumber + 1,
					},
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

				return json({ ok: true, next: 'turn', session: data });
			}

			// attacker (opponent) wins the round
			const winner = player === 1 ? 2 : 1;
			const updatedRoundData = { ...roundData, winner };

			const { error: updateError } = await supabaseAdmin
				.from('sessions')
				.update({ [roundColumn]: updatedRoundData })
				.eq('id', sessionId);

			if (updateError) {
				return json({ error: updateError.message }, { status: 500 });
			}

			return json({ ok: true, next: 'round', winner });
		}
	}

	// dmg success → opponent defends next
	// def success → same player (defender) becomes new attacker
	const nextPlayer = role === 'dmg' ? (player === 1 ? 2 : 1) : player;
	const nextRole = role === 'dmg' ? 'def' : 'dmg';
	const nextTurnNumber = turnNumber + 1;

	const updatedRoundData = {
		...roundData,
		current_turn: {
			player: nextPlayer,
			role: nextRole,
			number: nextTurnNumber,
		},
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

	return json({ ok: true, next: 'turn', session: data });
}
