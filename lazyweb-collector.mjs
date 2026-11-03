// Lazyweb page-request collector, version 1.
// Copy this file into the website's server or edge code unchanged; download it
// again from the same URL to update. No dependencies: Node 20+, Bun, Deno and
// the Vercel, Netlify and Cloudflare edge runtimes.
//
// It records one observation per completed public GET or HEAD whose response is
// HTML, Markdown or plain text, and never throws or delays the visitor's
// response. Deciding which pages are private stays with the application.

const PREVIEW = ['lazyweb_preview', 'agent_metrics_preview'];
// What Lazyweb answers when the owner forwards its routes at the site root.
const ROOT_ROUTES = /^\/(?:api\/public\/v1(?:\/|$)|mcp(?:\/|$)|agent-access(?:\.md)?$|agent\/faq$|agent-tools(?:\/|$)|agent-fragment$|config\.json$|page\.md$|pages\/[^/]+\.md$|s\/[^/]+\.md$)/;
const SIGNATURE_HEADERS = ['signature', 'signature-input', 'signature-agent'];

/**
 * @param {object} config
 * @param {string} config.events Events URL from the installation guide.
 * @param {string | undefined} config.token LAZYWEB_INGEST_TOKEN from the server or edge environment.
 * @param {'edge' | 'origin'} [config.layer] 'edge' only when this code also runs for CDN cache hits.
 * @param {string} [config.prefix] The path forwarded to Lazyweb (for example '/agents', or '/' when its
 *   routes are forwarded at the site root). Lazyweb records reads of its own pages itself and says so
 *   in the response; a forwarded page is recorded here only when Lazyweb marks it a document it did not
 *   record (a forward authenticated with the site token takes those reads over).
 * @param {string} [config.origin] The site's public origin. The Node adapter records page URLs on it
 *   instead of trusting Host and X-Forwarded-* headers a caller can set.
 * @param {number} [config.timeoutMs] Per-attempt delivery timeout.
 */
export function createCollector({ events, token, layer = 'origin', prefix = '', origin = '', timeoutMs = 2000, fetch: send = globalThis.fetch } = {}) {
  const lazywebPath = prefix.replace(/\/+$/, '');
  const lazywebRoute = prefix === '/' ? path => ROOT_ROUTES.test(path)
    : lazywebPath ? path => path === lazywebPath || path.startsWith(lazywebPath + '/') : () => false;
  /**
   * Record one response. Call after the response is known and keep the
   * invocation alive until the promise settles (waitUntil, after(), or a
   * persistent Node process).
   * @param {Request | {method: string, url: string, headers: any}} request
   * @param {Response | {status: number, headers?: any}} response
   * @param {{private?: boolean, clientIp?: string, origin?: string}} [options]
   *   private: the application's own policy says this page is not public.
   *   clientIp: only an address the hosting platform established.
   *   origin: public origin, when a proxy hides the public Host header.
   * @returns {Promise<{sent: boolean, reason?: string}>}
   */
  async function observe(request, response, options = {}) {
    try {
      if (!events || !token) return { sent: false, reason: 'not_configured' };
      if (options.private) return { sent: false, reason: 'private' };
      const method = String(request.method || 'GET').toUpperCase();
      if (method !== 'GET' && method !== 'HEAD') return { sent: false, reason: 'method' };
      const header = name => readHeader(request.headers, name);
      const requested = new URL(request.url, `https://${header('host') || 'localhost'}`);
      if (PREVIEW.some(name => requested.searchParams.has(name))) return { sent: false, reason: 'preview' };
      const status = Number(response?.status);
      if (!Number.isInteger(status) || status < 100 || status > 599) return { sent: false, reason: 'status' };
      // A visible response without a content type is not a page; only a layer
      // that cannot see the response (no headers at all) falls back to the path.
      const representation = response.headers ? representationOf(readHeader(response.headers, 'content-type')) : representationOf(null, requested.pathname);
      if (!representation) return { sent: false, reason: 'not_a_page' };
      // Each read of a forwarded Lazyweb page is recorded once. Lazyweb records it
      // and says so, unless a token-authenticated forward took it over; a layer
      // that cannot see the response leaves it to Lazyweb.
      const document = lazywebRoute(requested.pathname);
      if (document && !(response.headers && readHeader(response.headers, 'x-lazyweb-collection-role') === 'document'
        && readHeader(response.headers, 'x-lazyweb-read-recorded') !== '1')) return { sent: false, reason: 'lazyweb_route' };
      const testRun = header('x-lazyweb-test-run-id') || requested.searchParams.get('lazyweb_test_run');
      const signed = Object.fromEntries(SIGNATURE_HEADERS.map(name => [name, header(name)]).filter(([, value]) => value));
      const site = options.origin ? new URL(options.origin).origin : requested.origin;
      // A Lazyweb copy of a page is a read of the one page it declares canonical.
      const canonical = document ? canonicalOf(readHeader(response.headers, 'link'), site) : null;
      const event = {
        id: crypto.randomUUID(), kind: 'request', occurred_at: new Date().toISOString(),
        url: canonical || site + requested.pathname,
        method, status, representation, collection_layer: layer, ...(document ? { collection_role: 'document' } : {}),
        ...(header('user-agent') ? { user_agent: header('user-agent').slice(0, 500) } : {}),
        ...(options.clientIp ? { client_ip: String(options.clientIp).slice(0, 100) } : {}),
        ...(testRun ? { test_run_id: testRun.slice(0, 100) } : {}),
        // The signature covers the authority the agent addressed: the public host.
        ...(Object.keys(signed).length ? { request_headers: signed, authority: (options.origin ? new URL(options.origin).host : requested.host).slice(0, 255) } : {})
      };
      const body = JSON.stringify({ events: [event] });
      let reason = 'delivery_failed';
      // One retry with the same event id never counts twice.
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          // 'manual', not 'error': Cloudflare Workers reject redirect: 'error'. A redirect is never followed with the token.
          const reply = await send(events, { method: 'POST', body, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs),
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } });
          const outcome = await reply.json().catch(() => null);
          const item = outcome?.results?.[0];
          if (reply.ok) {
            const matches = Array.isArray(outcome?.results) && outcome.results.length === 1
              && item?.index === 0 && item?.id === event.id;
            if (matches && outcome.accepted === 1 && item.status === 'accepted') return { sent: true };
            if (matches && outcome.accepted === 0 && (item.status === 'rejected' || item.status === 'ignored'))
              return { sent: false, reason: item.code || item.status };
            // A 2xx without this event's receipt does not confirm persistence.
            reason = 'invalid_ack';
            continue;
          }
          reason = item?.code || `http_${reply.status}`;
          if (reply.status < 500 && reply.status !== 429) break;
        } catch (error) { reason = error?.name === 'TimeoutError' ? 'timeout' : 'network'; }
      }
      return { sent: false, reason };
    } catch { return { sent: false, reason: 'error' }; }
  }

  /**
   * Node http, Express, Connect and similar: app.use(collector.node()).
   * Records each response when it finishes; the visitor never waits for it.
   * @param {(req: any, res: any) => {private?: boolean, clientIp?: string, origin?: string}} [decide]
   */
  function node(decide = () => ({})) {
    return (req, res, next) => {
      // Headers passed straight to writeHead() never reach getHeaders().
      let written = {};
      const writeHead = res.writeHead;
      res.writeHead = function (status, ...rest) {
        try {
          // An object, or Node's flat [name, value, name, value] array.
          const headers = rest.find(value => value && typeof value === 'object');
          const pairs = Array.isArray(headers) ? headers.flatMap((value, index) => index % 2 ? [] : [[value, headers[index + 1]]]) : Object.entries(headers || {});
          if (headers) written = Object.fromEntries(pairs.map(([name, value]) => [String(name).toLowerCase(), value]));
        } catch { /* Collection never changes the response. */ }
        return writeHead.call(this, status, ...rest);
      };
      // An exception in a 'finish' listener would crash the server, so nothing escapes it.
      res.once('finish', () => {
        try {
          let options = decide(req, res) || {};
          const base = options.origin || origin || `${req.socket?.encrypted ? 'https' : 'http'}://${req.headers.host}`;
          const url = new URL(req.originalUrl || req.url, base).href;
          if (!options.origin && origin) options = { ...options, origin };
          void observe({ method: req.method, url, headers: req.headers }, { status: res.statusCode, headers: { ...written, ...res.getHeaders() } }, options);
        } catch { /* Malformed requests are not recorded. */ }
      });
      if (typeof next === 'function') next();
    };
  }

  return { observe, node };
}

function canonicalOf(link, site) {
  const targets = String(link || '').split(/,(?=\s*<)/).map(part => /^\s*<([^>]+)>\s*;(.*)$/.exec(part))
    .filter(match => match && /(?:^|;)\s*rel\s*=\s*"?canonical"?\s*(?:;|$)/i.test(match[2]) && !/(?:^|;)\s*anchor\s*=/i.test(match[2]));
  if (targets.length !== 1) return null;
  try {
    const url = new URL(targets[0][1], site);
    return url.origin === site ? url.origin + url.pathname : null;
  } catch { return null; }
}

function readHeader(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);
  const key = Object.keys(headers).find(candidate => candidate.toLowerCase() === name);
  const value = key === undefined ? undefined : headers[key];
  return Array.isArray(value) ? value.join(', ') : value == null ? null : String(value);
}

// The response's own content type decides; a path is only a fallback for a
// layer that cannot see the response.
function representationOf(contentType, pathname) {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (type === 'text/html' || type === 'application/xhtml+xml') return 'html';
  if (type === 'text/markdown' || type === 'text/x-markdown') return 'markdown';
  if (type === 'text/plain') return 'text';
  if (type || pathname == null) return null;
  if (/\.(?:md|markdown)$/i.test(pathname)) return 'markdown';
  if (/\.txt$/i.test(pathname)) return 'text';
  if (/\.(?:html?|xhtml)$/i.test(pathname)) return 'html';
  return /\.[a-z0-9]+$/i.test(pathname.split('/').pop() || '') ? null : 'html';
}
