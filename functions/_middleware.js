import { createCollector } from '../lazyweb-collector.mjs';

export async function onRequest(context) {
  const response = await context.next();
  const collector = createCollector({
    events: 'https://xie-qingyu-portfolio-2026.thelazyweb.com/events',
    token: context.env.LAZYWEB_INGEST_TOKEN,
    layer: 'edge',
    prefix: '/agents',
  });

  context.waitUntil(collector.observe(context.request, response));

  return response;
}
