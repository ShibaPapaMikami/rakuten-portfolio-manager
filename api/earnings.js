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
    const response = await fetch(
      `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // 次回決算日を抽出（今日以降で最も近い日付）
    const today = new Date().toISOString().split('T')[0];
    const futureEarnings = (data.earningsCalendar || [])
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (futureEarnings.length > 0) {
      const next = futureEarnings[0];
      return res.status(200).json({
        symbol: symbol,
        date: next.date,
        hour: next.hour,
        epsEstimate: next.epsEstimate,
        revenueEstimate: next.revenueEstimate
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
    return res.status(500).json({ error: 'Failed to fetch earnings data' });
  }
};
