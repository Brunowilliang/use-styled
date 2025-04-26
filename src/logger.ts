import { Chalk } from 'chalk'

const chalk = new Chalk({ level: 3 })

export const logger = {
	info: (message: string) => {
		console.log(chalk.blueBright(`ℹ️ ${message}`))
	},
	success: (message: string) => {
		console.log(chalk.greenBright(`✅ ${message}`))
	},
	warn: (message: string) => {
		console.log(chalk.yellowBright(`⚠️ ${message}`))
	},
	error: (message: string) => {
		console.log(chalk.redBright(`❌ ${message}`))
	},
	debug: (name: string | undefined, description: string, obj: any) => {
		console.log(chalk.magenta(`[${name}] - ${description}`))
		try {
			console.log(obj)
		} catch (logErr: any) {
			console.log(chalk.red(`Erro ao logar objeto: ${logErr.message}`))
			try {
				console.log(chalk.yellow('Keys:', Object.keys(obj).join(', ')))
			} catch {
				console.log(chalk.yellow('Objeto não pôde ser inspecionado'))
			}
		}
	},
}
