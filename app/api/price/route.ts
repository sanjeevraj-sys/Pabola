import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawTicker = searchParams.get('ticker');

  if (!rawTicker) {
    return NextResponse.json({ error: 'No ticker provided' }, { status: 400 });
  }

  // THE TRANSLATOR: Automatically fix crypto tickers for Yahoo Finance
  let ticker = rawTicker.toUpperCase();
  if (ticker === 'BTC') ticker = 'BTC-USD';
  if (ticker === 'ETH') ticker = 'ETH-USD';

  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`, {
      cache: 'no-store'
    });
    const data = await response.json();
    
    const price = data.chart.result[0].meta.regularMarketPrice;
    
    return NextResponse.json({ price });
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return NextResponse.json({ error: 'Failed to fetch stock price' }, { status: 500 });
  }
}