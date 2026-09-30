import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';
const browserPath = process.env.MSEDGE_PATH || 'C:\\PROGRA~2\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(browserPath)) throw new Error(`Microsoft Edge not found at ${browserPath}. Set MSEDGE_PATH.`);

const profile = mkdtempSync(join(tmpdir(), 'mukh4mmadov-qa-'));
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

let socket;
const pending = new Map();
let nextId = 0;
const browserErrors = [];

function command(method, params = {}) {
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`CDP command timed out: ${method}`));
    }, 10000);
    pending.set(id, { resolve, reject, timeout });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await command('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Browser evaluation failed');
  return result.result?.value;
}

async function waitForPage() {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const state = await evaluate('document.readyState');
      const bodyText = await evaluate('document.body?.innerText || ""');
      if (state === 'complete' && bodyText.length > 10) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('Timed out waiting for page content');
}

async function navigate(path, width, height, theme) {
  await command('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  });
  await command('Page.navigate', { url: `${baseUrl}${path}` });
  await waitForPage();
  await evaluate(`localStorage.setItem('themePreference', '${theme}')`);
  await command('Page.reload', { ignoreCache: true });
  await waitForPage();
  const headingDeadline = Date.now() + 15000;
  while (Date.now() < headingDeadline) {
    if (await evaluate('Boolean(document.querySelector("h1")?.innerText?.trim())')) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  const result = await evaluate(`({
    title: document.title,
    heading: document.querySelector('h1')?.innerText || '',
    bodyPreview: document.body?.innerText?.slice(0, 180) || '',
    path: location.pathname,
    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
    width: innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    canonicalPath: document.querySelector('link[rel="canonical"]') ? new URL(document.querySelector('link[rel="canonical"]').href).pathname : '',
    hasShareImage: Boolean(document.querySelector('meta[property="og:image"]')),
    noindex: document.querySelector('meta[name="robots"]')?.content?.includes('noindex') || false,
  })`);
  if (!result.heading.trim()) throw new Error(`${path} never rendered a page heading; final route=${result.path}; title=${result.title}; body=${result.bodyPreview}; browser errors=${browserErrors.join(' | ') || 'none captured'}`);
  if (result.theme !== theme) throw new Error(`${path} did not apply ${theme} theme`);
  if (result.path === path && !result.noindex && result.canonicalPath !== result.path) {
    throw new Error(`${path} has canonical URL ${result.canonicalPath || '(missing)'}`);
  }
  if (path === '/statistics' && result.path === '/login' && !result.title.toLowerCase().includes('sign in')) {
    throw new Error(`Statistics redirect landed on /login with stale title: ${result.title}`);
  }
  if (result.path === path && ['/', '/reading', '/reading/the-science-of-sleep', '/changelog', '/roadmap'].includes(path) && !result.hasShareImage) {
    throw new Error(`${path} has no Open Graph image`);
  }
  if (result.documentWidth > result.width || result.bodyWidth > result.width) {
    throw new Error(`${path} overflows at ${width}px: document=${result.documentWidth}, body=${result.bodyWidth}`);
  }
  return result;
}

try {
  const portFile = join(profile, 'DevToolsActivePort');
  const deadline = Date.now() + 15000;
  while (!existsSync(portFile) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
  if (!existsSync(portFile)) throw new Error('Edge did not start its DevTools endpoint');
  const port = readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const target = targets.find((entry) => entry.type === 'page');
  if (!target) throw new Error('Edge did not create a page target');

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      browserErrors.push([
        details?.text || 'Browser runtime exception',
        details?.exception?.description || '',
        details?.url ? `${details.url}:${details.lineNumber}` : '',
      ].filter(Boolean).join(' '));
    }
    const current = pending.get(message.id);
    if (!current) return;
    clearTimeout(current.timeout);
    pending.delete(message.id);
    if (message.error) current.reject(new Error(message.error.message));
    else current.resolve(message.result);
  });

  await command('Page.enable');
  await command('Runtime.enable');

  const mainRoutes = [
    '/', '/reading', '/reading/the-science-of-sleep', '/review',
    '/statistics', '/changelog', '/roadmap',
  ];
  const results = [];
  for (const theme of ['dark', 'light']) {
    for (const width of [1440, 390, 375, 320]) {
      for (const path of mainRoutes) {
        const result = await navigate(path, width, 844, theme);
        results.push({ route: result.path, theme, width, title: result.title, heading: result.heading });
      }
    }
    for (const path of ['/admin', '/admin/users', '/admin/issues', '/admin/changelog']) {
      const result = await navigate(path, 390, 844, theme);
      results.push({ route: result.path, requestedPath: path, theme, width: 390, title: result.title, heading: result.heading });
    }
  }

  await navigate('/review', 390, 844, 'dark');
  await evaluate(`localStorage.setItem('ielts-reading-review-queue-v1:guest', JSON.stringify([{
    id: 'science:test-question', passageSlug: 'the-science-of-sleep', passageTitle: 'The Science of Sleep',
    questionId: 'qa-test', questionNumber: 1, questionType: 'true-false-not-given',
    questionText: 'A safe temporary QA review question.', selectedAnswer: 'FALSE', correctAnswer: 'TRUE',
    explanation: 'This is disposable browser data.', evidence: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), attempts: 1
  }]))`);
  await command('Page.reload', { ignoreCache: true });
  await waitForPage();
  const seeded = await evaluate(`document.body.innerText.includes('A safe temporary QA review question.')`);
  if (!seeded) throw new Error('Review queue did not render a saved item');
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Mark reviewed'))?.click()`);
  const marked = await evaluate(`document.body.innerText.includes('Reviewed')`);
  if (!marked) throw new Error('Review queue mark-reviewed action failed');
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Remove from queue'))?.click()`);
  const removed = await evaluate(`document.body.innerText.includes('Your review queue is clear')`);
  if (!removed) throw new Error('Review queue remove action failed');

  if (browserErrors.length) throw new Error(`Browser runtime exceptions:\n${browserErrors.join('\n')}`);
  console.log(JSON.stringify({ status: 'pass', routeChecks: results.length, reviewQueue: 'seed, mark reviewed, remove passed', results }, null, 2));
} finally {
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  browser.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
