// Congress.gov API v3 client (tracker spec §2.3). No dependencies.
// The key travels only in the X-Api-Key header, so no URL we build or log carries it.
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = "https://api.congress.gov/v3";
const SPACING_MS = 750;
const MAX_RETRIES = 5;
const CACHE_DIR = path.join(".cache", "congress");

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local: CI passes CONGRESS_API_KEY as an environment variable.
}
const KEY = process.env.CONGRESS_API_KEY;
// Checked at the first request, so an offline --rebuild runs without a key.
const MISSING_KEY =
  'CONGRESS_API_KEY is missing. Get a key at https://api.congress.gov/sign-up/, then from the repo root run: Add-Content .env.local "CONGRESS_API_KEY=<your key>"';

export const stats = { requests: 0, cacheHits: 0 };

// --rebuild: answer from the disk cache only; a miss is an error, never a request.
let offline = false;
export const goOffline = () => {
  offline = true;
};

let lastRequestAt = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function describe(apiPath, params) {
  const q = new URLSearchParams(params).toString();
  return q ? `${apiPath}?${q}` : apiPath;
}

function cacheFile(apiPath, params) {
  const sorted = Object.fromEntries(Object.entries(params).sort(([a], [b]) => a.localeCompare(b)));
  const hash = createHash("sha1").update(describe(apiPath, sorted)).digest("hex");
  return path.join(CACHE_DIR, `${hash}.json`);
}

async function request(apiPath, params, auth) {
  if (!KEY) throw new Error(MISSING_KEY);
  const url = new URL(BASE + apiPath);
  for (const [k, v] of Object.entries({ ...params, format: "json" })) url.searchParams.set(k, String(v));
  const headers = {};
  if (auth === "query") url.searchParams.set("api_key", KEY);
  else headers["X-Api-Key"] = KEY;

  for (let attempt = 0; ; attempt++) {
    const wait = lastRequestAt + SPACING_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequestAt = Date.now();
    stats.requests++;

    let res;
    try {
      res = await fetch(url, { headers });
    } catch (err) {
      // A network error's message can include the URL; report only our safe description.
      if (attempt < MAX_RETRIES) {
        await sleep(2 ** attempt * 1000);
        continue;
      }
      throw new Error(`${describe(apiPath, params)}: network error (${err.cause?.code ?? err.name})`);
    }

    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining !== null) stats.rateLimitRemaining = Number(remaining);

    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get("retry-after"));
      const delay = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 1000;
      console.warn(
        `${describe(apiPath, params)}: HTTP ${res.status}, retry ${attempt + 1} in ${delay} ms` +
          (remaining !== null ? ` (rate limit remaining ${remaining})` : ""),
      );
      await sleep(delay);
      continue;
    }
    // api.data.gov puts a code like API_KEY_INVALID in the body; it never echoes the key.
    const code = await res
      .json()
      .then((b) => b.error?.code)
      .catch(() => undefined);
    throw new Error(`${describe(apiPath, params)}: HTTP ${res.status}${code ? ` ${code}` : ""}`);
  }
}

/**
 * GET one API path. `cacheVersion` (e.g. a bill's updateDate|updateDateIncludingText)
 * turns on the disk cache: a stored response is reused while its version matches.
 * Without it (list sweeps) nothing is cached.
 */
export async function get(apiPath, params = {}, { cacheVersion, auth = "header" } = {}) {
  const file = cacheVersion ? cacheFile(apiPath, params) : null;
  if (file) {
    try {
      const hit = JSON.parse(await readFile(file, "utf8"));
      if (hit.version === cacheVersion) {
        stats.cacheHits++;
        return hit.data;
      }
    } catch {
      // Not cached yet.
    }
  }
  if (offline) throw new Error(`${describe(apiPath, params)}: not in the cache (run npm run tracker:fetch first)`);
  const data = await request(apiPath, params, auth);
  if (file) await store(file, cacheVersion, data);
  return data;
}

async function store(file, version, data) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, JSON.stringify({ version, data }));
}

/**
 * GET a path that's always fetched fresh (a bill's detail), keeping the latest copy on
 * disk so --rebuild can work offline. Online runs never read that copy.
 */
export async function getLatest(apiPath) {
  const file = cacheFile(apiPath, {});
  if (offline) {
    const hit = await readFile(file, "utf8").then(JSON.parse, () => null);
    if (hit?.version !== "latest") throw new Error(`${apiPath}: not in the cache (run npm run tracker:fetch first)`);
    stats.cacheHits++;
    return hit.data;
  }
  const data = await request(apiPath, {}, "header");
  await store(file, "latest", data);
  return data;
}

/** Every response getLatest has kept (for --rebuild). */
export async function cachedLatest() {
  const files = await readdir(CACHE_DIR).catch(() => []);
  const entries = await Promise.all(files.map((f) => readFile(path.join(CACHE_DIR, f), "utf8").then(JSON.parse)));
  return entries.filter((e) => e.version === "latest").map((e) => e.data);
}

/** Follows pagination.next at limit=250 and returns every item under `itemsKey`. */
export async function paginate(apiPath, params, itemsKey, opts) {
  const items = [];
  let offset = 0;
  for (;;) {
    const page = await get(apiPath, { ...params, limit: 250, offset }, opts);
    items.push(...(page[itemsKey] ?? []));
    const next = page.pagination?.next;
    if (!next) return items;
    const nextOffset = Number(new URL(next).searchParams.get("offset"));
    if (!(nextOffset > offset)) throw new Error(`${apiPath}: pagination.next has no usable offset`);
    offset = nextOffset;
  }
}
