import { config } from "@repo/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
	...config,
	{
		files: ["src/**/*.ts", "src/**/*.tsx"],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
		},
	},
];
