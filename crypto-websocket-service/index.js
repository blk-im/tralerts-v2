const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

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

const streams = TOP_100
  .map(symbol => `${symbol.toLowerCase()}usdt@ticker`)
  .join('/');

let ws;

function connect() {
  console.log('🔄 Connexion au WebSocket Binance...');
  
  ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

  ws.on('open', () => {
    console.log(`✅ Connecté à Binance WebSocket - ${TOP_100.length} cryptos`);
  });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.data) {
        const ticker = message.data;
        const symbol = ticker.s.replace('USDT', '');

        const { error } = await supabase
          .from('crypto_prices')
          .upsert({
            symbol,
            name: symbol,
            price: parseFloat(ticker.c),
            change24h: parseFloat(ticker.P),
            volume24h: parseFloat(ticker.v) * parseFloat(ticker.c),
            high24h: parseFloat(ticker.h),
            low24h: parseFloat(ticker.l),
            updated_at: new Date().toISOString()
          }, { onConflict: 'symbol' });

        if (error) {
          console.error(`❌ Erreur Supabase pour ${symbol}:`, error.message);
        }
      }
    } catch (error) {
      console.error('❌ Erreur traitement message:', error.message);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ Erreur WebSocket:', error.message);
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket fermé - Reconnexion dans 5s...');
    setTimeout(connect, 5000);
  });
}

connect();

require('http').createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Service OK - ${TOP_100.length} cryptos en temps réel`);
}).listen(process.env.PORT || 3000, () => {
  console.log(`🌐 Health check server sur port ${process.env.PORT || 3000}`);
});
