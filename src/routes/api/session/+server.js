import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

function generateCode() {
	return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function POST() {
	const code_1 = generateCode();
	const code_2 = generateCode();

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.insert({
			status: 'created',
			code_1,
			code_2
		})
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ session: data });
}
