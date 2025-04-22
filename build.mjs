import { $ } from 'bun'
import { logger } from './utils/logger'

const entrypoint = './index.ts'
const outdir = './dist'

logger.info('Limpando diretório de saída...')
await $`rm -rf ${outdir}`
logger.success('Diretório de saída limpo!')

logger.info(`Construindo o pacote ${entrypoint}...`)

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
	logger.error('Falha no build ESM:')
	logger.error(result.logs.join('\n'))
	process.exit(1)
}
logger.success('Pacote construído!')

logger.info('Gerando tipos...')
await $`tsc --project tsconfig.json`

logger.success('Types gerados!')

logger.success('Build Finalizada!')
