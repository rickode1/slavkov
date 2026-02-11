import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode, unit } = await request.json();

	if (!sessionId || !playerCode || !unit) {
		return json({ error: 'missing_fields' }, { status: 400 });
	}

	const validUnits = ['soldier', 'cavalry', 'cannon'];
	if (!validUnits.includes(unit)) {
		return json({ error: 'invalid_unit' }, { status: 400 });
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
	const unitKey = playerCode === 'code_1' ? 'unit_1' : 'unit_2';

	// Merge with existing round data
	const existingRoundData = session[roundColumn] || {};
	const updatedRoundData = {
		...existingRoundData,
		[unitKey]: unit
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
