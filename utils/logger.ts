import {Chalk} from 'chalk';

const chalk = new Chalk({level: 3});

export const logger = {
	info: (message: string) => {
		console.log(chalk.blueBright(`ℹ️ ${message}`));
	},
	success: (message: string) => {
		console.log(chalk.greenBright(`✅ ${message}`));
	},
	warn: (message: string) => {
		console.log(chalk.yellowBright(`⚠️ ${message}`));
	},
	error: (message: string) => {
		console.log(chalk.redBright(`❌ ${message}`));
	},
}

