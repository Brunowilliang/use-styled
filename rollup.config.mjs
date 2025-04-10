import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import del from "rollup-plugin-delete";
import packageJson from "./package.json" with { type: "json" };

const external = [
	...Object.keys(packageJson.peerDependencies || {}),
	"react/jsx-runtime",
];

export default [
	{
		input: "index.tsx",
		output: [
			{
				file: packageJson.main,
				format: "cjs",
				sourcemap: true,
			},
			{
				file: packageJson.module,
				format: "esm",
				sourcemap: true,
			},
		],
		plugins: [
			del({ targets: "dist/*" }),
			resolve(),
			commonjs(),
			typescript({
				tsconfig: "./tsconfig.json",
				declaration: true,
				declarationDir: "dist",
				rootDir: ".",
			}),
		],
		external: external,
	},
];
