import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { typescript, setupTypeScript } from '../dist/index.js';
import { setup, resetFixtures } from './utils.js';

describe('typescript', async () => {
	const fixture = setup();

	it('none', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ ts: 'strict', useTs: true }) };
		await typescript(context);

		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('use false', async () => {
		const context = { cwd: '', dryRun: true, prompt: () => ({ ts: 'strict', useTs: false }) };
		await typescript(context);

		assert.ok(fixture.hasMessage('No worries'));
	});

	it('strict', async () => {
		const context = {
			typescript: 'strict',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);
		assert.ok(fixture.hasMessage('Using strict TypeScript configuration'));
		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('default', async () => {
		const context = {
			typescript: 'default',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);
		assert.ok(fixture.hasMessage('Using default TypeScript configuration'));
		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('relaxed', async () => {
		const context = {
			typescript: 'relaxed',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
		};
		await typescript(context);
		assert.ok(fixture.hasMessage('Using relaxed TypeScript configuration'));
		assert.ok(fixture.hasMessage('Skipping TypeScript setup'));
	});

	it('other', async () => {
		const context = {
			typescript: 'other',
			cwd: '',
			dryRun: true,
			prompt: () => ({ ts: 'strict' }),
			exit(code) {
				throw code;
			},
		};
		let err = null;
		try {
			await typescript(context);
		} catch (e) {
			err = e;
		}
		assert.equal(err, 1);
	});
});

describe('typescript: setup tsconfig', async () => {
	beforeEach(() => resetFixtures());

	it('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);

		await setupTypeScript('strict', { cwd: fileURLToPath(root) });
		assert.deepEqual(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' })), {
			extends: 'astro/tsconfigs/strict',
		});
	});

	it('exists', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const tsconfig = new URL('./tsconfig.json', root);
		await setupTypeScript('strict', { cwd: fileURLToPath(root) });
		assert.deepEqual(JSON.parse(fs.readFileSync(tsconfig, { encoding: 'utf-8' })), {
			extends: 'astro/tsconfigs/strict',
		});
	});
});

describe('typescript: setup package', async () => {
	beforeEach(() => resetFixtures());

	it('none', async () => {
		const root = new URL('./fixtures/empty/', import.meta.url);
		const packageJson = new URL('./package.json', root);

		await setupTypeScript('strictest', { cwd: fileURLToPath(root), install: false });
		assert.ok(!fs.existsSync(packageJson));
	});

	it('none', async () => {
		const root = new URL('./fixtures/not-empty/', import.meta.url);
		const packageJson = new URL('./package.json', root);
		assert.equal(
			JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf-8' })).scripts.build,
			'astro build'
		);

		await setupTypeScript('strictest', { cwd: fileURLToPath(root), install: false });
		const { scripts } = JSON.parse(fs.readFileSync(packageJson, { encoding: 'utf-8' }));

		assert.deepEqual(
			Object.keys(scripts),
			['dev', 'build', 'preview'],
			'does not override existing scripts'
		);

		assert.equal(scripts.build, 'astro check && astro build', 'prepends astro check command');
	});
});
