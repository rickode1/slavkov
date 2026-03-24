import adapter from '@sveltejs/adapter-vercel';

const config = {
	kit: {
  alias: {
			$components: './src/components',
		},
		adapter: adapter()
	}
};

export default config;
