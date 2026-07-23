export type SharePlatform = 'x' | 'misskey';

export interface CredentialFreeShareIntent {
  platform: SharePlatform;
  credentialRequired: false;
  url: string;
}

export interface MisskeyPostResult {
  id: string;
}

export interface MisskeyPostOptions {
  url?: string;
  visibility?: 'public' | 'home' | 'followers' | 'specified';
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

function safeHttpUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    if (!parsed.hostname) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

/** Normalize a root Misskey instance without persisting a token or accepting a path/query. */
export function normalizeMisskeyInstance(instance: string): string {
  let parsed: URL;
  try { parsed = new URL(instance.trim()); } catch { throw new Error('Misskey instance URLを入力してください。'); }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('Misskey instance URLはhttp(s)で指定してください。');
  const pathWithoutTrailingSlashes = parsed.pathname.replace(/\/+$/, '');
  if (!parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash || pathWithoutTrailingSlashes !== '') throw new Error('Misskey instance URLはルートURLで指定してください。');
  return parsed.origin;
}

export function buildXShareUrl(text: string, url?: string): string {
  const params = new URLSearchParams({ text });
  const safeUrl = safeHttpUrl(url);
  if (safeUrl) params.set('url', safeUrl);
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function buildMisskeyShareUrl(instance: string, text: string, url?: string): string {
  const normalized = normalizeMisskeyInstance(instance);
  const safeUrl = safeHttpUrl(url);
  const shareText = safeUrl ? `${text}\n${safeUrl}` : text;
  return `${normalized}/share?${new URLSearchParams({ text: shareText }).toString()}`;
}

/** Post one note to a user-supplied Misskey instance without persisting the token. */
export async function postMisskeyNote(instance: string, token: string, text: string, options: MisskeyPostOptions = {}): Promise<MisskeyPostResult> {
  const normalized = normalizeMisskeyInstance(instance);
  const trimmedToken = token.trim();
  if (!trimmedToken) throw new Error('Misskey access tokenを入力してください。');
  const safeUrl = safeHttpUrl(options.url);
  const noteText = safeUrl ? `${text}\n${safeUrl}` : text;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${normalized}/api/notes/create`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ i: trimmedToken, text: noteText, visibility: options.visibility ?? 'public' }),
    ...(options.signal ? { signal: options.signal } : {}),
  });
  let body: unknown;
  try { body = await response.json(); } catch { throw new Error(`Misskey投稿の応答を解釈できませんでした（HTTP ${response.status}）。`); }
  if (!response.ok || !body || typeof body !== 'object' || typeof (body as { id?: unknown }).id !== 'string') {
    const message = body && typeof body === 'object' && typeof (body as { error?: { message?: unknown } }).error?.message === 'string'
      ? (body as { error: { message: string } }).error.message
      : `Misskey投稿に失敗しました（HTTP ${response.status}）。`;
    throw new Error(message);
  }
  return { id: (body as { id: string }).id };
}

/** Build a credential-free share intent; actual posting remains an explicit external gate. */
export function buildCredentialFreeShareIntent(platform: SharePlatform, text: string, options: { url?: string; instance?: string } = {}): CredentialFreeShareIntent {
  if (platform === 'x') return { platform, credentialRequired: false, url: buildXShareUrl(text, options.url) };
  if (!options.instance) throw new Error('Misskey共有にはinstance URLが必要です。');
  return { platform, credentialRequired: false, url: buildMisskeyShareUrl(options.instance, text, options.url) };
}
