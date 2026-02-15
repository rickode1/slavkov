import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, playerCode, slotId } = await request.json();

	if (!sessionId || !playerCode || !slotId) {
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
	const locKey = playerCode === 'code_1' ? 'loc_1' : 'loc_2';

	// Merge with existing round data
	const existingRoundData = session[roundColumn] || {};
	const updatedRoundData = {
		...existingRoundData,
		[locKey]: slotId
	};

	// Check if both players have selected unit and location
	const otherLocKey = playerCode === 'code_1' ? 'loc_2' : 'loc_1';
	const bothLocSelected = updatedRoundData[otherLocKey];
	const bothUnitsSelected = updatedRoundData.unit_1 && updatedRoundData.unit_2;

	const updateData = { [roundColumn]: updatedRoundData };
	if (bothLocSelected && bothUnitsSelected) {
		updateData.status = '4-bonuses';
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
