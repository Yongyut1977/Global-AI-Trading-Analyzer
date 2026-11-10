// Cloudflare Pages Functions - /api/price?symbol=BTCUSDT
// API Key อยู่ใน Environment Variables ของ Cloudflare เท่านั้น ไม่ได้อยู่ในโค้ดนี้
// ตั้งค่าใน dash.cloudflare.com > Pages > global-ai-trading > Settings > Environment variables:
// BINANCE_API_KEY, BINANCE_API_SECRET (ห้ามเปิดถอนเงิน)
export async function onRequest(context){
  const { request, env } = context;
  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') || 'BTCUSDT').toUpperCase();
  // 1. ลอง Binance Public (ไม่ต้องใช้ Key)
  try{
    const r = await fetch('https://api.binance.com/api/v3/ticker/24hr?symbol='+symbol);
    if(r.ok){ const d = await r.json(); return json({ source:'Binance', symbol, price: parseFloat(d.lastPrice), change24: parseFloat(d.priceChangePercent) }); }
  }catch(e){}
  // 2. สำรอง CoinGecko
  try{
    const map={BTC:'bitcoin',ETH:'ethereum',BNB:'binancecoin',SOL:'solana',XRP:'ripple',DOGE:'dogecoin'};
    const base=symbol.replace('USDT',''); const id=map[base]||'bitcoin';
    const r = await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+id+'&vs_currencies=usd&include_24hr_change=true');
    if(r.ok){ const d=await r.json(); return json({ source:'CoinGecko', symbol, price:d[id].usd, change24:d[id].usd_24h_change||0 }); }
  }catch(e){}
  // 3. ถ้าใช้ Key (สำหรับดูพอร์ต / ส่งออเดอร์ในอนาคต) - ตัวอย่างการเซ็นลายเซ็น Binance
  // const hasKey = !!env.BINANCE_API_KEY;
  return json({ source:'none', symbol, price:null, note:'API ข้างนอกไม่ตอบ - หน้าเว็บจะใช้โหมดจำลองให้เอง', hasKey: !!env.BINANCE_API_KEY }, 200);
}
function json(obj, status=200){ return new Response(JSON.stringify(obj), { status, headers:{ 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*', 'Cache-Control':'no-store' } }); }
