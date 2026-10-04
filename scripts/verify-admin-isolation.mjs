import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.AUDIT_NONADMIN_EMAIL;
const password = process.env.AUDIT_NONADMIN_PASSWORD;

if (!baseUrl || !anonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  process.exit(2);
}
if (!email || !password) {
  console.error("Set AUDIT_NONADMIN_EMAIL and AUDIT_NONADMIN_PASSWORD in your terminal, then rerun. Do not share the password.");
  process.exit(2);
}

const root = baseUrl.replace(/\/$/, "");
const jsonHeaders = { apikey: anonKey, "Content-Type": "application/json" };
const failures = [];

async function signIn() {
  const response = await fetch(`${root}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    console.error(`Test account sign-in failed (HTTP ${response.status}). Check the credentials and account confirmation.`);
    process.exit(1);
  }
  return response.json();
}

async function checkEmpty(label, endpoint, token) {
  const response = await fetch(endpoint, {
    headers: { ...jsonHeaders, Authorization: `Bearer ${token}`, Prefer: "count=exact" },
  });
  if (!response.ok) {
    const safeDenial = response.status === 401 || response.status === 403;
    console.log(`${safeDenial ? "PASS" : "CHECK"} ${label}: HTTP ${response.status}${safeDenial ? " (access denied)" : " (could not verify)"}`);
    if (!safeDenial) failures.push(label);
    return;
  }
  const rows = await response.json();
  const count = Array.isArray(rows) ? rows.length : 0;
  console.log(`${count === 0 ? "PASS" : "FAIL"} ${label}: ${count} other-user row(s) visible`);
  if (count !== 0) failures.push(label);
}

const session = await signIn();
const userId = session.user?.id;
const token = session.access_token;
if (!userId || !token || session.user?.is_anonymous) {
  console.error("The test account must be a confirmed, signed-in non-guest account.");
  process.exit(2);
}

const api = (path, params) => {
  const url = new URL(`${root}/rest/v1/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("limit", "2");
  return url;
};

await checkEmpty("Profiles", api("profiles", { select: "id", id: `neq.${userId}` }), token);
await checkEmpty("Reading history", api("reading_history", { select: "id", user_id: `neq.${userId}` }), token);
await checkEmpty("Reading progress", api("reading_progress", { select: "id", user_id: `neq.${userId}` }), token);
await checkEmpty("Mock attempts", api("reading_mock_attempts", { select: "id", user_id: `neq.${userId}` }), token);
await checkEmpty("Support tickets", api("support_tickets", { select: "id", owner_id: `neq.${userId}` }), token);
await checkEmpty("Donation conversations", api("donation_conversations", { select: "id", user_id: `neq.${userId}` }), token);
await checkEmpty("Admin user statistics view", api("admin_user_statistics", { select: "user_id" }), token);
await checkEmpty("Admin AI summary view", api("admin_user_ai_summary", { select: "user_id" }), token);

const adminCheck = await fetch(`${root}/rest/v1/rpc/is_admin_user`, {
  method: "POST",
  headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
  body: JSON.stringify({ user_id: userId }),
});
if (adminCheck.ok) {
  const isAdmin = await adminCheck.json();
  console.log(`${isAdmin === false ? "PASS" : "FAIL"} Current test user is not treated as admin.`);
  if (isAdmin !== false) failures.push("is_admin_user");
} else {
  console.log(`CHECK is_admin_user RPC: HTTP ${adminCheck.status} (could not verify)`);
  failures.push("is_admin_user");
}

const storageResponse = await fetch(`${root}/storage/v1/object/list/donation-proofs`, {
  method: "POST",
  headers: { ...jsonHeaders, Authorization: `Bearer ${token}` },
  body: JSON.stringify({ prefix: "", limit: 100, offset: 0 }),
});
if (storageResponse.ok) {
  const objects = await storageResponse.json();
  const count = Array.isArray(objects) ? objects.length : 0;
  console.log(`${count === 0 ? "PASS" : "FAIL"} Private donation storage: ${count} object(s) visible to the test account.`);
  if (count !== 0) failures.push("donation storage");
} else {
  const safeDenial = storageResponse.status === 401 || storageResponse.status === 403;
  console.log(`${safeDenial ? "PASS" : "CHECK"} Private donation storage: HTTP ${storageResponse.status}${safeDenial ? " (access denied)" : " (could not verify)"}`);
  if (!safeDenial) failures.push("donation storage");
}

console.log(failures.length ? `Isolation checks need attention: ${failures.join(", ")}` : "All non-admin isolation checks passed.");
if (failures.length) process.exitCode = 1;
