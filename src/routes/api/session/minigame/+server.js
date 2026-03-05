import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode, type, value } = await request.json();

	if (!sessionId || !playerCode || !type || value == null) {
		return json({ error: 'missing_fields' }, { status: 400 });
	}

	const validTypes = ['dmg', 'def'];
	if (!validTypes.includes(type)) {
		return json({ error: 'invalid_type' }, { status: 400 });
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
	if (!round || round < 1 || round > 3) {
		return json({ error: 'invalid_round' }, { status: 400 });
	}

	const roundColumn = `round_${round}`;
	const suffix = playerCode === 'code_1' ? '_1' : '_2';
	const bonusKey = `bonus_minigame_${type}${suffix}`;

	const updatedRoundData = {
		...(session[roundColumn] || {}),
		[bonusKey]: value,
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

	return json({ session: data });
}
