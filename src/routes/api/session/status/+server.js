import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, status } = await request.json();

	if (!sessionId) {
		return json({ error: 'Session ID is required' }, { status: 400 });
	}

	if (!status) {
		return json({ error: 'Status is required' }, { status: 400 });
	}

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.update({ status })
		.eq('id', sessionId)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ session: data });
}
