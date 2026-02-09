import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { code } = await request.json();

	if (!code || code.length !== 4) {
		return json({ error: 'Invalid code' }, { status: 400 });
	}

	// Search for session with this code (either code_1 or code_2)
	const { data: session, error: fetchError } = await supabaseAdmin
		.from('sessions')
		.select('*')
		.or(`code_1.eq.${code},code_2.eq.${code}`)
		.single();

	if (fetchError || !session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	// Compare as strings to handle potential type mismatch
	const usedCode = String(session.code_1) === String(code) ? 'code_1' : 'code_2';
	const otherCode = usedCode === 'code_1' ? 'code_2' : 'code_1';

	// Check if other player already connected (other code is null)
	const otherPlayerConnected = session[otherCode] === null;

	// Clear the used code, and set status to 'started' if both players connected
	const updateData = { [usedCode]: null };
	if (otherPlayerConnected) {
		updateData.status = 'started';
	}

	const { error: updateError } = await supabaseAdmin
		.from('sessions')
		.update(updateData)
		.eq('id', session.id);

	if (updateError) {
		return json({ error: updateError.message }, { status: 500 });
	}

	return json({ 
		session,
		playerCode: usedCode
	});
}
