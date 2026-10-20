import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Security Test 1: Exposed Secret & Credential Scanning', () => {
  const tokenRegex = /[0-9]{8,10}:[a-zA-Z0-9_-]{35}/;

  it('should not contain exposed bot tokens in client source files (src/)', () => {
    const srcDir = path.resolve('src');
    const walk = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.html')) {
          results.push(file);
        }
      });
      return results;
    };

    const files = walk(srcDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const match = content.match(tokenRegex);
      assert.strictEqual(
        match,
        null,
        `Exposed Telegram bot token found in client file: ${path.relative(process.cwd(), file)}`
      );
    }
  });

  it('should not contain exposed bot tokens in production dist bundle', () => {
    const distDir = path.resolve('dist');
    if (!fs.existsSync(distDir)) {
      // If not yet built, skip or notify
      return;
    }
    const walk = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
          results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
          results.push(file);
        }
      });
      return results;
    };

    const files = walk(distDir);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      const match = content.match(tokenRegex);
      assert.strictEqual(
        match,
        null,
        `Exposed Telegram bot token found in production dist file: ${path.relative(process.cwd(), file)}`
      );
    }
  });

  it('should not contain live bot tokens in .env.example', () => {
    const examplePath = path.resolve('.env.example');
    assert.ok(fs.existsSync(examplePath), '.env.example must exist');
    const content = fs.readFileSync(examplePath, 'utf-8');
    const match = content.match(tokenRegex);
    assert.strictEqual(match, null, 'Exposed bot token pattern found in .env.example template');
  });
});

