import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				black: '#000000',
				primary: '#B4332B',
				secondary: '#0D3870',
				orange: {
					DEFAULT: '#fd9c3b',
					500: '#fd9c3b'
				}
			},
			spacing: {
				// Non-standard values used in this project (n × 0.25rem)
				'5.5':  '1.375rem',
				'6.5':  '1.625rem',
				'12.5': '3.125rem',
				'13':   '3.25rem',
				'15':   '3.75rem',
				'18':   '4.5rem',
				'19':   '4.75rem',
				'19.72':'4.93rem',
				'22':   '5.5rem',
				'26':   '6.5rem',
				'30':   '7.5rem',
				'34':   '8.5rem',
				'35':   '8.75rem',
				'38':   '9.5rem',
				'50':   '12.5rem',
				'58':   '14.5rem',
				'90':   '22.5rem',
				'100':  '25rem',
				'110':  '27.5rem',
				'124':  '31rem',
				'125':  '31.25rem',
				'130':  '32.5rem',
				'135':  '33.75rem',
				'180':  '45rem',
				'340':  '85rem',
				'440':  '110rem',
			},
			transitionDuration: {
				'2000': '2000ms',
			}
		}
	},
	plugins: [forms, typography]
};
