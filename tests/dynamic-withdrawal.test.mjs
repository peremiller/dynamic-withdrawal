import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url));
const html = read('index.html').toString('utf8');
const worker = read('sw.js').toString('utf8');
const offline = JSON.parse(read('offline-assets.json').toString('utf8'));
const assets = ['favicon.svg', 'index.html', 'manifest.webmanifest', 'offline-client.js'];

test('every simulation input and currency selector has an associated label', () => {
  for (const id of ['currency','port','wr','years','ret','vol','inf','ess','thr','cut','floor','ceil','trials']) {
    assert.match(html, new RegExp('<label for="' + id + '">'));
    assert.match(html, new RegExp('(?:<input|<select)\\b[^>]*\\bid="' + id + '"'));
  }
});

test('chart has a descriptive text equivalent updated from simulated percentile outputs', () => {
  assert.match(html, /<h2 id="fanChartHeading">/);
  assert.match(html, /<canvas id="fanChart"[^>]*role="img"[^>]*aria-labelledby="fanChartHeading"[^>]*aria-describedby="fanChartSummary"/);
  assert.match(html, /<p id="fanChartSummary"[^>]*aria-live="polite"/);
  assert.match(html, /fanChartSummary'\\)\\.textContent = 'After '/);
  for (const token of ['dyn.medianEnd', 'fix.medianEnd', 'dyn.p10[p.years]', 'dyn.p90[p.years]', 'fix.p10[p.years]', 'fix.p90[p.years]']) assert.ok(html.includes(token));
});

test('keyboard focus and narrow layout are defined; reduced-motion spinner is supported', () => {
  assert.match(html, /:focus-visible \\{ outline: 3px solid var\\(--text\\)/);
  assert.match(html, /@media \\(prefers-reduced-motion: reduce\\)/);
  assert.match(html, /@media \\(max-width: 430px\\)/);
  assert.match(html, /class="sr-only" aria-live="polite"/);
});

test('preserve simulation controls, outcomes, algorithms, and existing routes', () => {
  for (const name of ['simulateOne','runStrategy','drawFan','run','renderTable','buildCandidates','suggest','applyPlan']) assert.ok(html.includes('function ' + name + '('));
  assert.match(html, /<main class="results">/);
  assert.match(html, /id="runBtn"/);
  assert.match(html, /id="suggestBtn"/);
  assert.match(html, /id="pathTable"/);
  assert.match(html, /<link rel="manifest" href="manifest.webmanifest">/);
});

test('generated service worker and offline manifest equal the public asset digest', () => {
  const h = createHash('sha256');
  let bytes = 0;
  for (const path of assets) { const contents = read(path); h.update(path, 'utf8'); h.update(contents); bytes += contents.byteLength; }
  assert.equal(h.digest('hex').slice(0,20), offline.version);
  assert.equal(offline.bytes, bytes);
  assert.equal(offline.files, assets.length);
  assert.equal(offline.pages, 1);
  const first = worker.split('\\n')[0].replace(/^const CONFIG = /,'').replace(/;$/,'');
  const conf = JSON.parse(first);
  assert.equal(conf.version, offline.version);
  assert.deepEqual(conf.assets, assets);
  assert.deepEqual(conf.pages, ['index.html']);
  assert.equal(conf.spa, false);
});

test('inline simulation JavaScript parses', () => {
  const inline = html.match(/<script>\\s*([\\s\\S]*?)<\\/script>/);
  assert.ok(inline, 'Expected inline simulation logic');
  assert.doesNotThrow(() => new Function(inline[1]));
});
