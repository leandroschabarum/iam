import { defineConfig } from 'tsdown';

export default defineConfig([
	{
		entry: ['src/server/index.ts'],
		outDir: 'dist/server',
		format: ['esm', 'cjs'],
		platform: 'node',
		minify: true,
		dts: true
	},
	{
		entry: ['src/client/index.ts'],
		outDir: 'dist/client',
		format: ['esm', 'cjs'],
		platform: 'browser',
		minify: true,
		dts: true
	}
]);
