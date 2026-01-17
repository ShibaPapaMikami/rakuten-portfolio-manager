// Vercel Serverless Function: 決算日取得API
// Finnhub APIを使用して米国株の決算日を取得

export default async function handler(req, res) {
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

  const { symbols } = req.query;

  if (!symbols) {
    return res.status(400).json({ error: 'symbols parameter is required' });
  }

  const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

  if (!FINNHUB_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const results = {};

  try {
    // 各シンボルの決算日を取得
    const promises = symbolList.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/calendar/earnings?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch earnings for ${symbol}: ${response.status}`);
          return { symbol, data: null };
        }

        const data = await response.json();
        
        // 次の決算日を探す（今日以降で最も近い日付）
        const today = new Date().toISOString().split('T')[0];
        const futureEarnings = (data.earningsCalendar || [])
          .filter(e => e.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (futureEarnings.length > 0) {
          const next = futureEarnings[0];
          return {
            symbol,
            data: {
              nextEarnings: next.date,
              time: next.hour === 'amc' ? 'AMC' : next.hour === 'bmo' ? 'BMO' : 'TBD',
              epsEstimate: next.epsEstimate,
              revenueEstimate: next.revenueEstimate
            }
          };
        } else {
          // 過去のデータから次の四半期を推測
          const pastEarnings = (data.earningsCalendar || [])
            .sort((a, b) => b.date.localeCompare(a.date));
          
          if (pastEarnings.length > 0) {
            // 最新の決算日から約3ヶ月後を推測
            const lastDate = new Date(pastEarnings[0].date);
            lastDate.setMonth(lastDate.getMonth() + 3);
            return {
              symbol,
              data: {
                nextEarnings: lastDate.toISOString().split('T')[0],
                time: pastEarnings[0].hour === 'amc' ? 'AMC' : pastEarnings[0].hour === 'bmo' ? 'BMO' : 'TBD',
                estimated: true
              }
            };
          }
        }

        return { symbol, data: null };
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        return { symbol, data: null };
      }
    });

    const responses = await Promise.all(promises);
    
    responses.forEach(({ symbol, data }) => {
      results[symbol] = data;
    });

    return res.status(200).json({
      success: true,
      earnings: results,
      fetchedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
