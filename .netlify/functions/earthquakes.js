export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const minMagnitude = Number(req.query.minMagnitude ?? 0);
  if (!Number.isFinite(minMagnitude) || minMagnitude < -2 || minMagnitude > 10) {
    return res.status(400).json({ error: 'Invalid magnitude filter' });
  }

  const feed = minMagnitude >= 1
    ? `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${minMagnitude >= 4.5 ? '4.5' : minMagnitude >= 2.5 ? '2.5' : '1.0'}_day.geojson`
    : 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

  try {
    const upstream = await fetch(feed, {
      headers: { accept: 'application/geo+json', 'user-agent': 'ZYREX-Earthquake/1.0' }
    });
    const text = await upstream.text();
    if (!upstream.ok) return res.status(502).json({ error: 'Earthquake provider unavailable' });

    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(502).json({ error: 'Invalid earthquake response' }); }

    const features = Array.isArray(data.features) ? data.features.filter(f =>
      Number(f?.properties?.mag ?? -99) >= minMagnitude
    ) : [];

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.setHeader('X-Provider', 'USGS');
    return res.status(200).json({
      type: 'FeatureCollection',
      metadata: data.metadata || {},
      features
    });
  } catch {
    return res.status(502).json({ error: 'Earthquake provider unavailable' });
  }
}
