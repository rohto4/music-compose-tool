import { describe, expect, it } from 'vitest';
import { buildCredentialFreeShareIntent, buildMisskeyShareUrl, buildXShareUrl, normalizeMisskeyInstance, postMisskeyNote } from './share-intent';

describe('share intent builders', () => {
  it('encodes X share text and optional project URL without sending anything', () => {
    const result = new URL(buildXShareUrl('Soda & Sky', 'http://127.0.0.1:4173/project/1'));
    expect(result.hostname).toBe('twitter.com');
    expect(result.pathname).toBe('/intent/tweet');
    expect(result.searchParams.get('text')).toBe('Soda & Sky');
    expect(result.searchParams.get('url')).toBe('http://127.0.0.1:4173/project/1');
  });

  it('normalizes a Misskey instance and rejects path-bearing or invalid hosts', () => {
    const result = new URL(buildMisskeyShareUrl('https://misskey.example///', 'Patchtone draft'));
    expect(result.origin).toBe('https://misskey.example');
    expect(result.pathname).toBe('/share');
    expect(result.searchParams.get('text')).toBe('Patchtone draft');
    expect(() => buildMisskeyShareUrl('https://misskey.example/users/me', 'draft')).toThrow(/instance URL/);
    expect(() => buildMisskeyShareUrl('not-a-url', 'draft')).toThrow(/instance URL/);
    expect(() => normalizeMisskeyInstance('https://misskey.example/share?token=secret')).toThrow(/ルートURL/);
    expect(normalizeMisskeyInstance('http://127.0.0.1:3000/')).toBe('http://127.0.0.1:3000');
  });

  it('never forwards unsafe share URLs and exposes credential-free adapter metadata', () => {
    const x = new URL(buildXShareUrl('draft', 'file:///private/project.mctproj'));
    expect(x.searchParams.get('url')).toBeNull();
    const misskey = new URL(buildCredentialFreeShareIntent('misskey', 'draft', { instance: 'https://misskey.example', url: 'javascript:alert(1)' }).url);
    expect(misskey.searchParams.get('text')).toBe('draft');
    expect(buildCredentialFreeShareIntent('x', 'draft').credentialRequired).toBe(false);
  });

  it('posts a Misskey note only through the explicit transient adapter', async () => {
    let requestUrl = '';
    let requestBody = '';
    const result = await postMisskeyNote('https://misskey.example/', 'temporary-token', 'Soda Sky', {
      url: 'http://127.0.0.1:4173/',
      visibility: 'home',
      fetchImpl: (input, init) => {
        requestUrl = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        requestBody = typeof init?.body === 'string' ? init.body : '';
        return Promise.resolve(new Response(JSON.stringify({ id: 'note-123' }), { status: 200, headers: { 'content-type': 'application/json' } }));
      },
    });
    expect(result).toEqual({ id: 'note-123' });
    expect(requestUrl).toBe('https://misskey.example/api/notes/create');
    expect(requestBody).toContain('"i":"temporary-token"');
    expect(requestBody).toContain('"text":"Soda Sky\\nhttp://127.0.0.1:4173/"');
    expect(requestBody).toContain('"visibility":"home"');
    await expect(postMisskeyNote('https://misskey.example', '  ', 'draft', { fetchImpl: () => Promise.resolve(new Response('{}')) })).rejects.toThrow(/access token/);
  });

  it('rejects malformed Misskey post responses', async () => {
    await expect(postMisskeyNote('https://misskey.example', 'secret-token', 'draft', { fetchImpl: () => Promise.resolve(new Response(JSON.stringify({ error: { message: 'bad request' } }), { status: 400 })) })).rejects.toThrow('bad request');
  });
});
