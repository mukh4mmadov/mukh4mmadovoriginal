import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';
const browserPath = process.env.MSEDGE_PATH || 'C:\\PROGRA~2\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(browserPath)) throw new Error(`Microsoft Edge not found at ${browserPath}. Set MSEDGE_PATH.`);

async function assertBaseUrlAvailable() {
  let response;
  try {
    response = await fetch(baseUrl, { redirect: 'manual' });
  } catch (error) {
    throw new Error(
      `QA target is unavailable at ${baseUrl}. Start the app with "npm run dev" or set QA_BASE_URL. ${error instanceof Error ? error.message : ''}`.trim(),
    );
  }

  if (!response.ok && ![301, 302, 307, 308].includes(response.status)) {
    throw new Error(`QA target ${baseUrl} responded with HTTP ${response.status}.`);
  }
}

async function assertApiGuards() {
  const checks = [
    { path: '/api/push/remind', expected: 401 },
    { path: '/api/push/subscribe', method: 'POST', body: '{}', expected: 401 },
    { path: '/api/auth/redirect', method: 'POST', body: '{}', expected: 403 },
    { path: '/api/feedback-notification', method: 'POST', body: '{}', expected: 403 },
    { path: '/api/ai-chat', method: 'POST', body: '{}', expected: 400 },
  ];

  for (const check of checks) {
    const response = await fetch(new URL(check.path, baseUrl), {
      method: check.method || 'GET',
      ...(check.body ? { headers: { 'Content-Type': 'application/json' }, body: check.body } : {}),
    });
    if (response.status !== check.expected) {
      throw new Error(`${check.path} returned HTTP ${response.status}; expected ${check.expected} without credentials or a valid body`);
    }
  }
  return checks.length;
}

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
  if (result.exceptionDetails) {
    const details = result.exceptionDetails;
    throw new Error(
      details.exception?.description ||
      details.text ||
      'Browser evaluation failed',
    );
  }
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
    bodyText: document.body?.innerText || '',
    hasReplacementCharacter: document.body?.innerText?.includes('\uFFFD') || false,
    hasCorruptedText: /(?:\uFFFD|Ã[\u0080-\u00FF]|Â[\u0080-\u00FF]|â€)/u.test(document.body?.innerText || ''),
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
  if (result.hasCorruptedText) throw new Error(`${path} contains text with a Unicode encoding artifact`);
  const policyCopy = {
    '/privacy': ['Gemini', '12 oy', 'amalda kafolatlanmaydi', 'javob olingan suhbatlar', 'avtomatik o‘chirish jadvali'],
    '/terms': ['IELTS tashkiloti yoki Cambridge bilan bog‘liq rasmiy xizmat emas', '18 yoshga to‘lmagan'],
    '/contact': ['@mukh4mmadov', 'omuhammadov467@gmail.com'],
  };
  if (policyCopy[path]) {
    if (result.hasReplacementCharacter || /Ã.|Â.|â€|ï¿½/.test(result.bodyText)) {
      throw new Error(`${path} contains corrupted text`);
    }
    const missingCopy = policyCopy[path].filter((copy) => !result.bodyText.toLowerCase().includes(copy.toLowerCase()));
    if (missingCopy.length) throw new Error(`${path} is missing expected policy copy: ${missingCopy.join(', ')}`);
  }
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
  await assertBaseUrlAvailable();
  const apiGuardChecks = await assertApiGuards();
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
    '/statistics', '/changelog', '/roadmap', '/privacy', '/terms', '/contact',
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

  await navigate('/', 1440, 844, 'dark');
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Help')?.click()`);
  const guestHelpText = await evaluate(`document.querySelector('[aria-labelledby="guest-help-title"]')?.innerText || ''`);
  if (!guestHelpText.includes('Please sign up or sign in to send feedback')) {
    throw new Error('Guest Help action did not explain the account requirement');
  }

  await navigate('/reading/the-science-of-sleep', 390, 844, 'dark');
  const answerResult = await evaluate(`(() => {
    const shell = document.querySelector('#reading-shell');
    const question = [...(shell?.querySelectorAll('[tabindex="-1"]') || [])]
      .find((item) => item.querySelector('input, button'));
    if (!shell || !question) return { selected: false, shell: Boolean(shell), question: Boolean(question) };
    const input = question.querySelector('input');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) setter.call(input, 'practice');
      else input.value = 'practice';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return { selected: true, control: 'input' };
    }
    const answerButton = question.querySelector('button');
    if (!answerButton) return { selected: false, shell: true, question: true, buttons: question.querySelectorAll('button').length };
    answerButton.click();
    return { selected: true, control: 'button' };
  })()`);
  if (!answerResult?.selected) throw new Error(`Guest reading flow did not expose an answer control: ${JSON.stringify(answerResult)}`);
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.getAttribute('aria-label') === 'Open AI Coach')?.click()`);
  const aiCoachReady = await evaluate(`(() => ({
    title: document.querySelector('#ai-reading-coach-title-mobile')?.innerText || document.querySelector('#ai-reading-coach-title')?.innerText || '',
    input: Boolean(document.querySelector('textarea[aria-label="Ask the AI Reading Coach about this passage"]')),
  }))()`);
  if (aiCoachReady.title !== 'AI Reading Coach' || !aiCoachReady.input) {
    throw new Error('Guest AI Coach panel did not open with its prompt field');
  }
  const aiPrompt = 'Give one brief strategy for finding evidence in a reading passage.';
  await evaluate(`(() => {
    const input = [...document.querySelectorAll('textarea[aria-label="Ask the AI Reading Coach about this passage"]')]
      .find((item) => item.getClientRects().length > 0);
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
    if (setter) setter.call(input, ${JSON.stringify(aiPrompt)});
    else input.value = ${JSON.stringify(aiPrompt)};
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const dialog = input.closest('[role="dialog"]');
    dialog?.querySelector('button[aria-label="Send message"]')?.click();
    return true;
  })()`);
  const aiDeadline = Date.now() + 45000;
  let aiOutcome;
  let guestAICoachStatus = 'reply received';
  while (Date.now() < aiDeadline) {
    aiOutcome = await evaluate(`(() => {
      const dialog = [...document.querySelectorAll('[role="dialog"][data-modal-focus-scope="ai-reading-coach"]')]
        .find((item) => item.getClientRects().length > 0);
      const messages = [...(dialog?.querySelectorAll('div') || [])]
        .filter((item) => String(item.className).includes('max-w-[80%]') && item.innerText.trim());
      const input = dialog?.querySelector('textarea[aria-label="Ask the AI Reading Coach about this passage"]');
      const error = dialog?.querySelector('[class*="bg-rose-500/10"]')?.innerText || '';
      return { count: messages.length, loading: Boolean(input?.disabled), error };
    })()`);
    if (aiOutcome.error && !aiOutcome.loading) {
      if (aiOutcome.error.includes('AI service is not configured on the server')) {
        guestAICoachStatus = 'NOT TESTED - Gemini server configuration is missing';
        break;
      }
      throw new Error(`Guest AI Coach request failed: ${aiOutcome.error}`);
    }
    if (aiOutcome.count >= 2 && !aiOutcome.loading) break;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (guestAICoachStatus === 'reply received' && (aiOutcome?.count < 2 || aiOutcome.loading)) {
    throw new Error('Guest AI Coach did not return a reply within 45 seconds');
  }
  await evaluate(`[...document.querySelectorAll('button[aria-label="Close chat"]')].find((button) => button.getClientRects().length > 0)?.click()`);
  const savedDraft = await evaluate(`(() => {
    const raw = localStorage.getItem('ielts-reading-the-science-of-sleep');
    const draft = raw ? JSON.parse(raw) : null;
    return {
      hasAnswer: Object.values(draft?.answers || {}).some(Boolean),
      timerVersion: draft?.timerVersion,
      timerRunning: draft?.timerRunning,
      remainingMilliseconds: draft?.remainingMilliseconds,
    };
  })()`);
  if (!savedDraft.hasAnswer || savedDraft.timerVersion !== 2 || !savedDraft.timerRunning || !(savedDraft.remainingMilliseconds > 0)) {
    throw new Error('Guest answer and active timer were not saved as a restorable draft');
  }
  await command('Page.reload', { ignoreCache: true });
  await waitForPage();
  const restoredDraft = await evaluate(`(() => {
    const raw = localStorage.getItem('ielts-reading-the-science-of-sleep');
    const draft = raw ? JSON.parse(raw) : null;
    const question = [...(document.querySelectorAll('#reading-shell [tabindex="-1"]') || [])]
      .find((item) => item.querySelector('input, button'));
    const input = question?.querySelector('input');
    const buttons = [...(question?.querySelectorAll('button') || [])];
    return {
      answerRestored: input ? input.value === 'practice' : buttons.some((button) => String(button.className).includes('bg-brand-500/20')),
      timerRestored: draft?.timerVersion === 2 && draft.timerRunning === true && draft.remainingMilliseconds > 0,
      notice: document.body.innerText.includes('Draft saved on this device'),
    };
  })()`);
  if (!restoredDraft.answerRestored || !restoredDraft.timerRestored || !restoredDraft.notice) {
    throw new Error(`Guest draft did not restore its answer and timer: ${JSON.stringify(restoredDraft)}`);
  }
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.innerText.trim() === 'Submit')?.click()`);
  const submitDialogOpened = await evaluate(`Boolean(document.querySelector('[aria-labelledby="submit-dialog-title"]'))`);
  if (!submitDialogOpened) throw new Error('Guest reading flow did not open the incomplete-answer confirmation');
  await evaluate(`[...document.querySelectorAll('button')].find((button) => button.innerText.includes('Submit Anyway'))?.click()`);
  const resultsDeadline = Date.now() + 10000;
  let guestAttempt;
  while (Date.now() < resultsDeadline) {
    guestAttempt = await evaluate(`(() => {
      const raw = localStorage.getItem('ielts_progress_the-science-of-sleep');
      const progress = raw ? JSON.parse(raw) : null;
      return {
        resultsVisible: document.body.innerText.includes('Your results'),
        attempts: progress?.attempts || 0,
        history: progress?.attemptHistory || [],
      };
    })()`);
    if (guestAttempt.resultsVisible && guestAttempt.attempts > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  const savedAttempt = guestAttempt?.history?.at(-1);
  if (!guestAttempt?.resultsVisible || guestAttempt.attempts < 1 || !Number.isFinite(new Date(savedAttempt?.completedAt).getTime())) {
    throw new Error('Guest submission did not show results and save a timestamped local attempt');
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
  console.log(JSON.stringify({ status: 'pass', routeChecks: results.length, apiGuardChecks, guestHelp: 'sign-in requirement shown', guestAICoach: guestAICoachStatus, guestAttempt: 'answer, refresh timer restoration, confirm submission, results, and timestamped local history passed', reviewQueue: 'seed, mark reviewed, remove passed', results }, null, 2));
} finally {
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  browser.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
