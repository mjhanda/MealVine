import { Platform } from 'react-native';

// The app's only request to a site the user chooses (T48): one GET of the recipe page the user
// pasted, started by them. Nothing about the user is sent: no cookies or credentials, no app data,
// no identifiers; just the URL they gave. See docs/project/security.md ("Network: recipe import").

const TIMEOUT_MS = 15_000;
const MAX_BYTES = 5_000_000;

// Browsers block reading other sites' pages (CORS), so on web the import screen offers paste-text only.
export const canFetchPages = (): boolean => Platform.OS !== 'web';

export class FetchPageError extends Error {}

export async function fetchRecipePage(url: string): Promise<string> {
  if (!canFetchPages()) throw new FetchPageError("This browser can't read other sites. Paste the recipe text instead.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      headers: { Accept: 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    if (!response.ok) throw new FetchPageError(`That page didn't load (error ${response.status}).`);
    if (Number(response.headers.get('content-length') ?? 0) > MAX_BYTES) throw new FetchPageError('That page is too large to read.');
    const text = await response.text();
    return text.length > MAX_BYTES ? text.slice(0, MAX_BYTES) : text;
  } catch (e) {
    if (e instanceof FetchPageError) throw e;
    if (controller.signal.aborted) throw new FetchPageError('That page took too long to load.');
    throw new FetchPageError("Couldn't reach that page. Check the link and your connection.");
  } finally {
    clearTimeout(timer);
  }
}
