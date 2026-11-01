// Invite a friend. The rules are enforced in the database (migration 023);
// keep these numbers in sync with it.
export const INVITE_FRIENDS_PER_CREDIT = 3;
export const INVITE_TESTS_NEEDED = 2;
export const INVITE_NEW_ACCOUNT_DAYS = 7;
export const INVITE_MONTHLY_LIMIT = 20;

export const PENDING_INVITE_KEY = "ielts-pending-invite-v1";
export const DEVICE_ID_KEY = "ielts-device-id-v1";
const PENDING_DAYS = 30;

export function normalizeInviteCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(code) ? code : null;
}

// Invite links always point at the public site, also when the page is
// opened on a preview deployment or a local copy.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mukh4mmadovoriginal.vercel.app";

export const inviteLink = (code, origin = SITE_URL) => `${String(origin).replace(/\/$/, "")}/invite/${code}`;

export function inviteShareText(link) {
  return `I'm preparing for IELTS on this free site: real exam-style Listening, Reading and Writing tests with AI feedback. Join with my link: ${link}`;
}

export const telegramShareLink = (link) =>
  `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Free IELTS practice: real exam-style tests with AI feedback.")}`;

// Free checks earned and how many more approved friends the next one needs.
export function inviteReward(approved) {
  const count = Math.max(0, Math.floor(Number(approved) || 0));
  const credits = Math.floor(count / INVITE_FRIENDS_PER_CREDIT);
  const towardsNext = count % INVITE_FRIENDS_PER_CREDIT;
  return { credits, towardsNext, needed: INVITE_FRIENDS_PER_CREDIT - towardsNext };
}

export const INVITE_STATUSES = {
  joined: { label: "Joined", tone: "brand" },
  qualified: { label: "Finished 2 tests · being checked", tone: "amber" },
  approved: { label: "Counted", tone: "emerald" },
  rejected: { label: "Not counted", tone: "rose" },
};

// What a friend sees after opening an invite link and signing in.
export const CLAIM_MESSAGES = {
  joined: { tone: "success", text: "You joined with your friend's invite. Finish two practice tests and it counts for them." },
  already_joined: { tone: "info", text: "You have already joined with an invite." },
  own_code: { tone: "info", text: "That's your own invite link. Send it to a friend instead." },
  not_new: { tone: "info", text: `Invite links only work for accounts created in the last ${INVITE_NEW_ACCOUNT_DAYS} days, after the person who invited you.` },
  same_device: { tone: "warning", text: "This invite can't be used on the same phone or computer as the person who sent it." },
  circular: { tone: "info", text: "You invited this person yourself, so their link can't be used for you." },
  limit_reached: { tone: "info", text: "Your friend has reached this month's invite limit. You can still use the site as normal." },
  invalid_code: { tone: "warning", text: "This invite link isn't valid. Check that it was copied in full." },
};

// Anything not listed (not_signed_in, network errors) is retried later.
export const isFinalClaimResult = (result) => Object.hasOwn(CLAIM_MESSAGES, result);

export const INVITE_FLAGS = {
  same_network: "Same Wi-Fi or network as the inviter",
  device_reused: "This device was already used by another invited friend",
  busy_network: "3+ friends of this inviter joined from one network",
  no_device: "No device id (private window or blocked storage)",
};

export function readPendingInvite(storage, now = Date.now()) {
  try {
    const value = JSON.parse(storage.getItem(PENDING_INVITE_KEY) || "null");
    const code = normalizeInviteCode(value?.code);
    if (!code || !(now - Number(value.savedAt) < PENDING_DAYS * 86400000)) return null;
    return code;
  } catch {
    return null;
  }
}

export function savePendingInvite(storage, code, now = Date.now()) {
  const normalized = normalizeInviteCode(code);
  if (!normalized) return false;
  try {
    storage.setItem(PENDING_INVITE_KEY, JSON.stringify({ code: normalized, savedAt: now }));
    return true;
  } catch {
    return false;
  }
}

export function clearPendingInvite(storage) {
  try { storage.removeItem(PENDING_INVITE_KEY); } catch { /* fine */ }
}

// A random id for this browser, kept so invites from the same device can be
// recognised. Only a hash of it is stored on the server.
export function getDeviceId(storage, random = () => globalThis.crypto.randomUUID()) {
  try {
    const existing = storage.getItem(DEVICE_ID_KEY);
    if (/^[A-Za-z0-9-]{16,64}$/.test(existing || "")) return existing;
    const created = random();
    storage.setItem(DEVICE_ID_KEY, created);
    return created;
  } catch {
    return null;
  }
}
