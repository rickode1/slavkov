import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST({ request }) {
	const { sessionId, seconds } = await request.json();

	if (!sessionId) {
		return json({ error: 'Session ID is required' }, { status: 400 });
	}

	const timer_deadline = seconds
		? new Date(Date.now() + seconds * 1000).toISOString()
		: null;

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.update({ timer_deadline })
		.eq('id', sessionId)
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ session: data });
}
