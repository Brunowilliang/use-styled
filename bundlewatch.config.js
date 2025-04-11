const bundlewatchConfig = {
	files: [
		{
			path: 'dist/index.js',
			maxSize: '5KB',
		},
		{
			path: 'dist/index.mjs',
			maxSize: '5KB',
		},
	],
}

module.exports = bundlewatchConfig
