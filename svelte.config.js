import adapter from '@sveltejs/adapter-vercel';

const config = {
	kit: {
  alias: {
			$components: './src/components',
		},
		adapter: adapter({
			images: {
				sizes: [640, 828, 1200, 1920, 3840],
				formats: ['image/avif', 'image/webp'],
				minimumCacheTTL: 300,
				localPatterns: [
					{ pathname: '^/assets/.*$', search: '' },
					{ pathname: '^/img/.*$', search: '' }
				]
			}   
  })
	}
};

export default config;
