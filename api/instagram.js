const DEFAULT_GRAPH_BASE_URL = 'https://graph.instagram.com';
const DEFAULT_GRAPH_VERSION = 'v23.0';
const MEDIA_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';

function normalizeBaseUrl(value) {
  return (value || DEFAULT_GRAPH_BASE_URL).replace(/\/+$/, '');
}

function sendJson(response, status, body) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    sendJson(response, 405, { items: [] });
    return;
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    sendJson(response, 503, { configured: false, items: [] });
    return;
  }

  const graphBaseUrl = normalizeBaseUrl(process.env.INSTAGRAM_GRAPH_BASE_URL);
  const graphVersion = (process.env.INSTAGRAM_GRAPH_VERSION || DEFAULT_GRAPH_VERSION).trim();
  const instagramUserId = (process.env.INSTAGRAM_USER_ID || 'me').trim();
  const params = new URLSearchParams({ fields: MEDIA_FIELDS, limit: '6' });
  const endpoint = `${graphBaseUrl}/${graphVersion}/${encodeURIComponent(instagramUserId)}/media?${params.toString()}`;

  try {
    const instagramResponse = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (!instagramResponse.ok) {
      console.error('Instagram feed request failed', instagramResponse.status);
      response.setHeader('Cache-Control', 'no-store');
      sendJson(response, 502, { configured: true, items: [] });
      return;
    }

    const payload = await instagramResponse.json();
    const items = Array.isArray(payload?.data)
      ? payload.data
          .map((item) => ({
            id: typeof item?.id === 'string' ? item.id : '',
            caption: typeof item?.caption === 'string' ? item.caption : '',
            mediaType: typeof item?.media_type === 'string' ? item.media_type : '',
            imageUrl:
              typeof item?.thumbnail_url === 'string' && item.thumbnail_url
                ? item.thumbnail_url
                : typeof item?.media_url === 'string'
                  ? item.media_url
                  : '',
            permalink: typeof item?.permalink === 'string' ? item.permalink : '',
            timestamp: typeof item?.timestamp === 'string' ? item.timestamp : ''
          }))
          .filter((item) => item.id && item.imageUrl && item.permalink)
          .slice(0, 6)
      : [];

    response.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    sendJson(response, 200, { configured: true, items });
  } catch (error) {
    console.error('Instagram feed request crashed', error instanceof Error ? error.message : 'unknown error');
    response.setHeader('Cache-Control', 'no-store');
    sendJson(response, 502, { configured: true, items: [] });
  }
}
