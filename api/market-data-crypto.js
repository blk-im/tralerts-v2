import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const CACHE_DURATION = 3000; // 3 secondes
let isFetching = false;

const TOP_100 = [
  'BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'AVAX',
  'SHIB', 'LTC', 'TRX', 'UNI', 'ATOM', 'ETC', 'LINK', 'XMR', 'BCH', 'XLM',
  'ALGO', 'FIL', 'APT', 'ARB', 'OP', 'NEAR', 'VET', 'HBAR', 'ICP', 'QNT',
  'LDO', 'STX', 'INJ', 'GRT', 'MKR', 'RUNE', 'AAVE', 'SNX', 'FTM', 'SAND',
  'MANA', 'AXS', 'THETA', 'XTZ', 'EOS', 'FLOW', 'CHZ', 'EGLD', 'ZEC', 'KAVA',
  'CAKE', 'ONE', 'ENJ', 'BAT', 'ZIL', 'DASH', 'COMP', 'YFI', 'CRV', 'SUSHI',
  'BAL', 'IOTX', 'ZRX', 'RVN', 'OMG', 'SC', 'ICX', 'ONT', 'QTUM', 'ZEN',
  'LSK', 'WAVES', 'KLAY', 'COTI', 'BNT', 'SXP', 'ANT', 'CVC', 'REP', 'RLC',
  'STORJ', 'OCEAN', 'NKN', 'BLZ', 'IOST', 'STMX', 'FUN', 'DENT', 'KEY', 'DATA',
  'HOT', 'WIN', 'BTT', 'CELR', 'TROY', 'OGN', 'WRX', 'PERL', 'VITE', 'FET'
];

// Mapping symbole → CoinGecko ID
const SYMBOL_TO_ID = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana',
  'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin', 'MATIC': 'polygon',
  'DOT': 'polkadot', 'AVAX': 'avalanche-2', 'SHIB': 'shiba-inu', 'LTC': 'litecoin',
  'TRX': 'tron', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'ETC': 'ethereum-classic',
  'LINK': 'chainlink', 'XMR': 'monero', 'BCH': 'bitcoin-cash', 'XLM': 'stellar',
  'ALGO': 'algorand', 'FIL': 'filecoin', 'APT': 'aptos', 'ARB': 'arbitrum',
  'OP': 'optimism', 'NEAR': 'near', 'VET': 'vechain', 'HBAR': 'hedera',
  'ICP': 'internet-computer', 'QNT': 'quant', 'LDO': 'lido-dao', 'STX': 'stacks',
  'INJ': 'injective-protocol', 'GRT': 'the-graph', 'MKR': 'maker', 'RUNE': 'thorchain',
  'AAVE': 'aave', 'SNX': 'synthetix', 'FTM': 'fantom', 'SAND': 'the-sandbox',
  'MANA': 'decentraland', 'AXS': 'axie-infinity', 'THETA': 'theta-network',
  'XTZ': 'tezos', 'EOS': 'eos', 'FLOW': 'flow', 'CHZ': 'chiliz',
  'EGLD': 'elrond', 'ZEC': 'zcash', 'KAVA': 'kava', 'CAKE': 'pancakeswap',
  'ONE': 'harmony', 'ENJ': 'enjincoin', 'BAT': 'basic-attention-token',
  'ZIL': 'zilliqa', 'DASH': 'dash', 'COMP': 'compound', 'YFI': 'yearn-finance',
  'CRV': 'curve-dao-token', 'SUSHI': 'sushi', 'BAL': 'balancer', 'IOTX': 'iotex',
  'ZRX': '0x', 'RVN': 'ravencoin', 'OMG': 'omisego', 'SC': 'siacoin',
  'ICX': 'icon', 'ONT': 'ontology', 'QTUM': 'qtum', 'ZEN': 'horizen',
  'LSK': 'lisk', 'WAVES': 'waves', 'KLAY': 'klay', 'COTI': 'coti',
  'BNT': 'bancor', 'SXP': 'swipe', 'ANT': 'aragon', 'CVC': 'civic',
  'REP': 'augur', 'RLC': 'rlc', 'STORJ': 'storj', 'OCEAN': 'ocean-protocol',
  'NKN': 'nkn', 'BLZ': 'bluzelle', 'IOST': 'iostoken', 'STMX': 'storm',
  'FUN': 'funfair', 'DENT': 'dent', 'KEY': 'selfkey', 'DATA': 'streamr',
  'HOT': 'holo', 'WIN': 'wink', 'BTT': 'bittorrent', 'CELR': 'celer-network',
  'TROY': 'troy', 'OGN': 'origin-protocol', 'WRX': 'wazirx', 'PERL': 'perlin',
  'VITE': 'vite', 'FET': 'fetch-ai'
};

export default async function handler(req, res) {
  try {
    // 1. Lire depuis Supabase
    const { data: allData } = await supabase
      .from('crypto_prices')
      .select('*')
      .order('volume24h', { ascending: false })
      .limit(100);

    const now = Date.now();
    const cacheAge = allData && allData[0] 
      ? now - new Date(allData[0].updated_at).getTime()
      : Infinity;

    // 2. Cache valide ? Retourner
    if (cacheAge < CACHE_DURATION) {
      return res.status(200).json({
        data: allData,
        cached: true,
        age: Math.floor(cacheAge / 1000)
      });
    }

    // 3. Quelqu'un fetch déjà ?
    if (isFetching) {
      return res.status(200).json({
        data: allData,
        cached: true,
        stale: true,
        age: Math.floor(cacheAge / 1000)
      });
    }

    // 4. Fetch Binance (prix temps réel)
    isFetching = true;

    const symbols = TOP_100.map(s => `"${s}USDT"`).join(',');
    const binanceResponse = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbols=[${symbols}]`
    );

    if (!binanceResponse.ok) {
      isFetching = false;
      throw new Error('Binance API error');
    }

    const binanceData = await binanceResponse.json();

    // 5. Fetch CoinGecko (market cap)
    const ids = Object.values(SYMBOL_TO_ID).join(',');
    const coinGeckoResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100`
    );

    const coinGeckoData = coinGeckoResponse.ok ? await coinGeckoResponse.json() : [];

    // 6. Combiner les données
    const updates = binanceData.map(ticker => {
      const symbol = ticker.symbol.replace('USDT', '');
      const coinGeckoInfo = coinGeckoData.find(c => 
        c.symbol.toUpperCase() === symbol
      );

      return {
        symbol,
        name: coinGeckoInfo?.name || symbol,
        price: parseFloat(ticker.lastPrice),
        change24h: parseFloat(ticker.priceChangePercent),
        volume24h: parseFloat(ticker.quoteVolume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        market_cap: coinGeckoInfo?.market_cap || null,
        circulating_supply: coinGeckoInfo?.circulating_supply || null,
        image: coinGeckoInfo?.image || null,
        rank: coinGeckoInfo?.market_cap_rank || null,
        updated_at: new Date().toISOString()
      };
    });

    // 7. Update Supabase
    const { error } = await supabase
      .from('crypto_prices')
      .upsert(updates, { onConflict: 'symbol' });

    if (error) {
      console.error('Supabase error:', error);
    }

    isFetching = false;

    res.status(200).json({
      data: updates,
      cached: false,
      age: 0
    });

  } catch (error) {
    isFetching = false;
    
    const { data: fallbackData } = await supabase
      .from('crypto_prices')
      .select('*')
      .order('volume24h', { ascending: false })
      .limit(100);
    
    if (fallbackData && fallbackData.length > 0) {
      return res.status(200).json({
        data: fallbackData,
        cached: true,
        error: error.message
      });
    }

    res.status(500).json({ error: error.message });
  }
}
