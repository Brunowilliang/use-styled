import { $ } from 'bun'
import { logger } from './src/logger'

const entrypoint = './index.ts'
const outdir = './dist'

logger.info('Cleaning output directory...')
await $`rm -rf ${outdir}`
logger.success('Output directory cleaned!')

logger.info(`Building package ${entrypoint}...`)

const result = await Bun.build({
	entrypoints: [entrypoint],
	outdir: outdir,
	target: 'browser',
	format: 'esm',
	splitting: true,
	sourcemap: 'external',
	minify: false,
	external: ['react', 'react-dom', 'react-native'],
})

if (!result.success) {
	logger.error('ESM build failed:')
	logger.error(result.logs.join('\n'))
	process.exit(1)
}
logger.success('Package built!')

logger.info('Generating types...')
await $`tsc --project tsconfig.json`

logger.success('Types generated!')

logger.success('Build finished!')
