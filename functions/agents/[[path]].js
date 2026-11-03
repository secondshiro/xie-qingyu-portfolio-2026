const LAZYWEB_ORIGIN = 'https://xie-qingyu-portfolio-2026.thelazyweb.com';

export async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const upstream = new URL(`${incoming.pathname.slice('/agents'.length)}${incoming.search}`, LAZYWEB_ORIGIN);
  const forwarded = new Request(upstream, request);

  forwarded.headers.delete('cookie');
  forwarded.headers.delete('authorization');

  return fetch(forwarded);
}
