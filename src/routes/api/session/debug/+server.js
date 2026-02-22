import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SECRET_KEY } from '$env/static/private';

const supabaseAdmin = createClient(PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);

export async function POST() {
	const units = ['soldier', 'cavalry', 'cannon'];
	const unit_1 = units[Math.floor(Math.random() * 3)];
	const unit_2 = units[Math.floor(Math.random() * 3)];

	const { data, error } = await supabaseAdmin
		.from('sessions')
		.insert({
			status: '4-bonuses',
			current_round: 1,
			player_1: {
				nick: 'Alpha',
				bust: 'fr',
				time: Math.floor(Math.random() * 100),
				dmg: Math.floor(Math.random() * 9),
				def: Math.floor(Math.random() * 9),
				life: Math.floor(Math.random() * 3)
			},
			player_2: {
				nick: 'Bravo',
				bust: 'at',
				time: Math.floor(Math.random() * 100),
				dmg: Math.floor(Math.random() * 9),
				def: Math.floor(Math.random() * 9),
				life: Math.floor(Math.random() * 3)
			},
			round_1: {
				unit_1,
				unit_2,
				loc_1: "1a",
				loc_2: "1d",
				bonus_loc_1: 1,
				bonus_loc_2: -1,
				current_turn: { player: 1, number: 0, role: 'dmg' }
			}
		})
		.select()
		.single();

	if (error) {
		return json({ error: error.message }, { status: 500 });
	}

	return json({ session: data });
}
