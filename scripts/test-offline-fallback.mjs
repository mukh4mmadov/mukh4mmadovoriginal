import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = Number(process.env.QA_OFFLINE_PORT || 3137);
const baseUrl = `http://localhost:${port}`;
const browserPath = process.env.MSEDGE_PATH || 'C:\\PROGRA~2\\Microsoft\\Edge\\Application\\msedge.exe';
if (!existsSync(browserPath)) throw new Error(`Microsoft Edge not found at ${browserPath}. Set MSEDGE_PATH.`);

let server;
let socket;
const profile = mkdtempSync(join(tmpdir(), 'mukh4mmadov-offline-qa-'));
const browser = spawn(browserPath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
], { stdio: 'ignore', windowsHide: true });

const pending = new Map();
let nextId = 0;

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
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  }
  return result.result?.value;
}

async function waitFor(predicate, label, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const value = await evaluate(predicate);
      if (value) return value;
    } catch {
      // A navigation can destroy the current execution context between polls.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function startServer() {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', String(port)], {
    stdio: 'ignore',
    windowsHide: true,
  });
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {}
    if (server.exitCode !== null) throw new Error(`Local Next.js server exited with code ${server.exitCode}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Timed out starting local production server at ${baseUrl}`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  const processToStop = server;
  const exited = new Promise((resolve) => processToStop.once('exit', resolve));
  processToStop.kill();
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5000))]);
  server = null;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      await fetch(baseUrl);
    } catch {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('The local server still responds after shutdown; offline checks would be unreliable');
}

try {
  await startServer();
  const portFile = join(profile, 'DevToolsActivePort');
  const portDeadline = Date.now() + 15000;
  while (!existsSync(portFile) && Date.now() < portDeadline) await new Promise((resolve) => setTimeout(resolve, 100));
  if (!existsSync(portFile)) throw new Error('Edge did not start its DevTools endpoint');

  const devtoolsPort = readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
  const targets = await fetch(`http://127.0.0.1:${devtoolsPort}/json/list`).then((response) => response.json());
  const target = targets.find((entry) => entry.type === 'page');
  if (!target) throw new Error('Edge did not create a page target');

  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(String(event.data));
    const current = pending.get(message.id);
    if (!current) return;
    clearTimeout(current.timeout);
    pending.delete(message.id);
    if (message.error) current.reject(new Error(message.error.message));
    else current.resolve(message.result);
  });

  await command('Page.enable');
  await command('Runtime.enable');
  await command('Network.enable');
  await command('Emulation.setDeviceMetricsOverride', {
    width: 1280, height: 900, deviceScaleFactor: 1, mobile: false,
  });
  await command('Page.navigate', { url: baseUrl });
  await waitFor('document.readyState === "complete" && Boolean(document.querySelector("main"))', 'the online home page');
  await waitFor('navigator.serviceWorker.controller !== null', 'the service worker to control the page');
  await waitFor('caches.match("/offline.html").then(Boolean)', 'the offline fallback to be cached');

  await command('Network.setCacheDisabled', { cacheDisabled: true });
  const emulateOffline = () => command('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
  });
  const emulateOnline = () => command('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  const waitForOfflineMarker = () => waitFor(
    'caches.match("/__offline-status__").then(Boolean)',
    'the durable offline marker',
  );

  // Reproduce Home reload under browser offline emulation while the origin stays reachable.
  await emulateOffline();
  await waitFor('navigator.onLine === false', 'the browser offline state');
  await waitForOfflineMarker();
  await command('Page.reload', { ignoreCache: true });
  await waitFor('document.body?.innerText?.includes("You are offline")', 'the Home offline fallback under browser emulation');

  await emulateOnline();
  await waitFor('navigator.onLine === true', 'network recovery');
  await waitFor('document.readyState === "complete" && document.body?.innerText?.includes("All passages")', 'home recovery after browser emulation');
  await waitFor('caches.match("/__offline-status__").then((marker) => !marker)', 'offline marker cleanup after recovery');

  await emulateOffline();
  await waitFor('navigator.onLine === false', 'offline state before Contact navigation');
  await waitForOfflineMarker();
  await evaluate("document.querySelector('a[href=\"/contact\"]')?.click()");
  await waitFor('document.body?.innerText?.includes("You are offline")', 'the Contact route fallback under browser emulation');

  await emulateOnline();
  await waitFor('navigator.onLine === true', 'network recovery after Contact fallback');
  await waitFor('document.readyState === "complete" && document.body?.innerText?.includes("All passages")', 'home recovery after Contact fallback');
  await waitFor('caches.match("/__offline-status__").then((marker) => !marker)', 'offline marker cleanup after Contact recovery');

  // Also cover a true origin outage, independent of DevTools emulation.
  await command('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await waitFor('navigator.onLine === true', 'online state before origin outage');
  await command('Page.navigate', { url: baseUrl });
  await waitFor('navigator.serviceWorker.controller !== null', 'service worker control before origin outage');
  await stopServer();
  await command('Page.reload', { ignoreCache: true });
  await waitFor('document.body?.innerText?.includes("You are offline")', 'the home route fallback during origin outage');

  await startServer();
  await waitFor('navigator.onLine === true', 'online state after origin recovery');
  await command('Page.navigate', { url: baseUrl });
  await waitFor('document.readyState === "complete" && document.body?.innerText?.includes("All passages")', 'home page recovery');
  await waitFor('navigator.serviceWorker.controller !== null', 'service worker control after recovery');

  console.log('PASS: Home reload and Contact navigation show the offline fallback under browser offline emulation; recovery clears the marker and returns Home. A true origin outage also shows the fallback and recovers.');
} finally {
  if (socket && socket.readyState < WebSocket.CLOSING) socket.close();
  browser.kill();
  if (server && server.exitCode === null) server.kill();
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
