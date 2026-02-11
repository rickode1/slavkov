import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

function generateCode() {
	return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generateUniqueCode(supabase) {
	let code;
	let exists = true;

	while (exists) {
		code = generateCode();
		const { data } = await supabase
			.from('sessions')
			.select('id')
			.or(`code_1.eq.${code},code_2.eq.${code}`)
			.limit(1);

		exists = data && data.length > 0;
	}

	return code;
}

export async function POST() {
	const code_1 = await generateUniqueCode(supabaseAdmin);
	const code_2 = await generateUniqueCode(supabaseAdmin);

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.insert({
			status: '1-lobby',
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
