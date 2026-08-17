export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','POST'].includes(req.method)) return res.status(405).json({status:false,error:'Method not allowed'});

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const prompt = String(req.method === 'POST' ? body.prompt : (req.query?.prompt || '')).trim();
    const model = String(req.method === 'POST' ? (body.model || 'chat-model-reasoning') : (req.query?.model || 'chat-model-reasoning')).trim();
    if (!prompt) return res.status(400).json({status:false,error:'Prompt is required'});

    const upstream = new URL('https://elysian-api.vercel.app/api/ai/unlimited-ai.php');
    upstream.searchParams.set('prompt', prompt);
    upstream.searchParams.set('model', model);
    const r = await fetch(upstream, { headers: { Accept: 'application/json' } });
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { status:false, error:'Invalid AI response', raw:text.slice(0,500) }; }
    if (!r.ok || data?.status === false) return res.status(502).json({status:false,error:data?.error || 'AI provider error',provider:data});
    const result = data?.result ?? data?.data ?? data?.response ?? data?.answer ?? data?.text ?? data;
    return res.status(200).json({status:true,result});
  } catch (e) {
    return res.status(500).json({status:false,error:'AI service unavailable'});
  }
}
