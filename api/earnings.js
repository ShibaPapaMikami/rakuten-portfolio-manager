module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'symbol parameter is required' });
  }

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

  if (!FINNHUB_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // 今日から90日後までの範囲で検索
    const today = new Date();
    const fromDate = today.toISOString().split('T')[0];
    const toDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/calendar/earnings?from=${fromDate}&to=${toDate}&symbol=${symbol}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // 決算データを抽出
    if (data.earningsCalendar && data.earningsCalendar.length > 0) {
      // 最も近い決算日を取得
      const sorted = data.earningsCalendar.sort((a, b) => a.date.localeCompare(b.date));
      const next = sorted[0];
      
      return res.status(200).json({
        symbol: symbol,
        date: next.date,
        hour: next.hour, // 'bmo' = before market open, 'amc' = after market close
        epsEstimate: next.epsEstimate,
        revenueEstimate: next.revenueEstimate,
        year: next.year,
        quarter: next.quarter
      });
    } else {
      return res.status(200).json({
        symbol: symbol,
        date: null,
        message: 'No upcoming earnings found'
      });
    }
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return res.status(500).json({ error: 'Failed to fetch earnings data', details: error.message });
  }
};
