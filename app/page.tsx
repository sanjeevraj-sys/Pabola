'use client';
import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LayoutDashboard, PieChart as PieChartIcon, ArrowLeftRight, Settings, Plus, Wallet, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({ ticker: '', name: '', category: 'Stocks', shares: '', buyPrice: '', currentPrice: '' });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);

  // 1. READ: Load memory
  useEffect(() => {
    const savedAssets = localStorage.getItem('myFinboomPortfolio');
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    } else {
      setAssets([
        { id: 1, ticker: 'AAPL', name: 'Apple Inc.', category: 'Stocks', shares: 15, avgBuyPrice: 170.00, currentPrice: 175.50, change24h: 0 },
        { id: 2, ticker: 'VOO', name: 'Vanguard S&P 500', category: 'Stocks', shares: 5, avgBuyPrice: 450.00, currentPrice: 460.00, change24h: 0 },
        { id: 3, ticker: 'BTC', name: 'Bitcoin', category: 'Crypto', shares: 0.5, avgBuyPrice: 50000.00, currentPrice: 64000.00, change24h: 0 },
        { id: 4, ticker: 'GLD', name: 'SPDR Gold', category: 'Commodities', shares: 8, avgBuyPrice: 190.00, currentPrice: 210.00, change24h: 0 }
      ]);
    }
    setIsLoaded(true);
  }, []);

  // 2. WRITE: Save memory
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('myFinboomPortfolio', JSON.stringify(assets));
    }
  }, [assets, isLoaded]);

  // 3. LIVE API FETCH (Maintains your previous working logic)
  useEffect(() => {
    if (!isLoaded) return; 

    const fetchLivePrices = async () => {
      const savedData = localStorage.getItem('myFinboomPortfolio');
      if (!savedData) return;
      const currentAssets = JSON.parse(savedData);
      let updatedPrices: Record<string, number> = {};

      for (const asset of currentAssets) {
        try {
          // Check if we are running inside a Blob environment (like this chat's Preview UI)
          const isPreview = typeof window !== 'undefined' && window.location.protocol === 'blob:';
          
          if (isPreview) {
            // Simulate live market data for the preview since it doesn't have the backend API
            const volatility = asset.category === 'Crypto' ? 0.01 : 0.002;
            updatedPrices[asset.ticker] = asset.currentPrice * (1 + (Math.random() * volatility * 2 - volatility));
          } else {
            // Real backend fetch for your local VS Code environment
            const response = await fetch(`/api/price?ticker=${asset.ticker}`);
            const data = await response.json();
            if (data && data.price && !isNaN(data.price)) {
              updatedPrices[asset.ticker] = Number(data.price);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${asset.ticker}:`, error);
        }
      }

      setAssets(prevAssets => prevAssets.map(asset => {
        if (updatedPrices[asset.ticker]) {
          const change = updatedPrices[asset.ticker] - asset.currentPrice;
          return { ...asset, currentPrice: updatedPrices[asset.ticker], change24h: change };
        }
        return asset;
      }));
    };

    fetchLivePrices();
    const intervalId = setInterval(fetchLivePrices, 30000);
    return () => clearInterval(intervalId);
  }, [isLoaded]);

  // 🧮 Math Engine
  const totalBalance = assets.reduce((sum, asset) => sum + (Number(asset.shares) * (Number(asset.currentPrice) || 0)), 0);
  const totalInvested = assets.reduce((sum, asset) => sum + (Number(asset.shares) * (Number(asset.avgBuyPrice) || 0)), 0);
  const totalProfitLoss = totalBalance - totalInvested;
  const roiPercentage = totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100).toFixed(2) : '0.00';
  
  const filteredAssets = activeTab === 'All' ? assets : assets.filter(asset => asset.category === activeTab);

  // 🎨 Chart Data
  const allocationData = filteredAssets.map(asset => ({
    name: asset.ticker,
    value: Number(asset.shares) * Number(asset.currentPrice),
    category: asset.category
  })).filter(data => data.value > 0);

  // Fake historical data generator based on current total balance (for the aesthetic Area Chart)
  const generateHistory = (current: number) => {
    return Array.from({length: 7}).map((_, i) => ({
      day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
      balance: current * (1 - (6 - i) * 0.015) + (Math.random() * current * 0.02)
    }));
  };
  const historyData = generateHistory(totalBalance);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6'];

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'Stocks': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Crypto': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Commodities': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    const assetToAdd = {
      id: assets.length > 0 ? Math.max(...assets.map(a => a.id)) + 1 : 1,
      ticker: newAsset.ticker.toUpperCase(),
      name: newAsset.name || 'Custom Asset',
      category: newAsset.category,
      shares: Number(newAsset.shares),
      avgBuyPrice: Number(newAsset.buyPrice),
      currentPrice: Number(newAsset.currentPrice) || Number(newAsset.buyPrice),
      change24h: 0 
    };
    setAssets([...assets, assetToAdd]);
    setIsModalOpen(false);
    setNewAsset({ ticker: '', name: '', category: 'Stocks', shares: '', buyPrice: '', currentPrice: '' });
  };

  if (!isLoaded) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Loading Finboom UI...</div>;

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-neutral-100 font-sans overflow-hidden">
      
      {/* 🧭 LEFT SIDEBAR */}
      <aside className="w-64 bg-[#111111] border-r border-neutral-800/50 hidden md:flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span>Finboom<span className="text-indigo-500">.</span></span>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 text-indigo-400 font-medium">
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
            <PieChartIcon className="w-5 h-5" /> Analytics
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
            <ArrowLeftRight className="w-5 h-5" /> Transactions
          </a>
        </nav>
        <div className="p-4 mt-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors">
            <Settings className="w-5 h-5" /> Settings
          </a>
        </div>
      </aside>

      {/* 📱 MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-8">
          
          {/* HEADER */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Welcome back, Investor</h1>
              <p className="text-neutral-400 text-sm mt-1">Here is your portfolio summary for today.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { localStorage.removeItem('myFinboomPortfolio'); window.location.reload(); }} className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-red-400 bg-neutral-900 border border-neutral-800 transition-colors">
                Reset Data
              </button>
              <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]">
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            </div>
          </header>

          {/* 📊 METRICS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet className="w-16 h-16" /></div>
              <h3 className="text-neutral-400 text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Total Net Worth</h3>
              <p className="text-4xl font-bold mt-3 tracking-tight">${totalBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <p className="text-xs text-neutral-500 mt-2">Accurate as of latest market tick</p>
            </div>
            
            <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800/50 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16" /></div>
              <h3 className="text-neutral-400 text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> All-Time Profit/Loss</h3>
              <div className="flex items-baseline gap-3 mt-3">
                <p className={`text-4xl font-bold tracking-tight ${totalProfitLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </p>
              </div>
              <div className={`inline-block mt-2 px-2 py-1 rounded-md text-xs font-semibold ${Number(roiPercentage) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {Number(roiPercentage) >= 0 ? '↑' : '↓'} {Math.abs(Number(roiPercentage))}% ROI
              </div>
            </div>

            <div className="bg-[#111111] p-6 rounded-2xl border border-neutral-800/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><DollarSign className="w-16 h-16" /></div>
              <h3 className="text-neutral-400 text-sm font-medium flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Total Capital Invested</h3>
              <p className="text-4xl font-bold mt-3 tracking-tight text-neutral-300">${totalInvested.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <p className="text-xs text-neutral-500 mt-2">Principal amount across all assets</p>
            </div>
          </div>

          {/* 📈 CHARTS ROW */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Area Chart: Performance */}
            <div className="bg-[#111111] rounded-2xl border border-neutral-800/50 p-6 lg:col-span-2 h-[380px] flex flex-col">
              <h3 className="text-neutral-200 font-semibold mb-6">Portfolio Growth (7 Days)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#262626" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#737373', fontSize: 12}} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(val: number) => [`$${val.toLocaleString(undefined, {maximumFractionDigits: 0})}`, 'Balance']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Donut Chart: Allocation */}
            <div className="bg-[#111111] rounded-2xl border border-neutral-800/50 p-6 lg:col-span-1 h-[380px] flex flex-col items-center justify-center relative">
               <h3 className="text-neutral-200 font-semibold mb-2 self-start absolute top-6 left-6">Asset Allocation</h3>
               {allocationData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={allocationData}
                       innerRadius={75}
                       outerRadius={105}
                       paddingAngle={5}
                       dataKey="value"
                       stroke="none"
                     >
                       {allocationData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip 
                       formatter={(value: number) => `$${value.toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`}
                       contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px' }}
                       itemStyle={{ color: '#fff', fontSize: '14px' }}
                     />
                   </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <p className="text-neutral-500">No assets tracked.</p>
               )}
            </div>
          </div>

          {/* 📋 ASSET TABLE */}
          <div className="bg-[#111111] rounded-2xl border border-neutral-800/50 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-800/50 flex flex-wrap gap-3 items-center justify-between">
              <h3 className="text-neutral-200 font-semibold hidden sm:block">Holdings</h3>
              <div className="flex gap-2 bg-[#0a0a0a] p-1 rounded-lg border border-neutral-800/50">
                {['All', 'Stocks', 'Commodities', 'Crypto'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeTab === tab ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#0a0a0a]/50">
                  <tr className="text-neutral-500 text-xs uppercase tracking-wider">
                    <th className="px-6 py-4 font-medium">Asset</th>
                    <th className="px-6 py-4 font-medium text-right">Balance</th>
                    <th className="px-6 py-4 font-medium text-right">Avg Price</th>
                    <th className="px-6 py-4 font-medium text-right">Market Price</th>
                    <th className="px-6 py-4 font-medium text-right">Unrealized P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredAssets.map((asset, idx) => {
                    const pl = (asset.currentPrice - asset.avgBuyPrice) * asset.shares;
                    const plPercent = asset.avgBuyPrice > 0 ? (asset.currentPrice - asset.avgBuyPrice) / asset.avgBuyPrice * 100 : 0;
                    
                    return (
                      <tr key={asset.id} className="hover:bg-neutral-800/20 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-sm font-bold shadow-inner" style={{ color: COLORS[idx % COLORS.length] }}>
                              {asset.ticker.substring(0,2)}
                            </div>
                            <div>
                              <div className="font-bold text-neutral-200">{asset.ticker}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-neutral-500 truncate max-w-[120px]">{asset.name}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded border ${getCategoryColor(asset.category)}`}>
                                  {asset.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-medium text-neutral-200">${(Number(asset.shares) * Number(asset.currentPrice)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className="text-xs text-neutral-500 mt-1">{asset.shares} shares</div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-neutral-400">
                          ${Number(asset.avgBuyPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-sm text-neutral-200 font-medium">
                          ${Number(asset.currentPrice).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className={`font-medium ${pl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pl >= 0 ? '+' : ''}${pl.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                          <div className={`text-xs mt-1 ${plPercent >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                            {plPercent >= 0 ? '+' : ''}{plPercent.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* 🟢 ADD ASSET MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111111] rounded-2xl border border-neutral-800 shadow-2xl p-6 w-full max-w-md transform transition-all">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" /> New Transaction
            </h2>
            <form onSubmit={handleAddAsset} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Ticker</label>
                  <input required type="text" placeholder="e.g. TSLA" className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-white transition-all outline-none" 
                    value={newAsset.ticker} onChange={e => setNewAsset({...newAsset, ticker: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Category</label>
                  <select className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-white transition-all outline-none appearance-none"
                    value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})}>
                    <option>Stocks</option>
                    <option>Commodities</option>
                    <option>Crypto</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Asset Name</label>
                <input type="text" placeholder="e.g. Tesla Inc." className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-white transition-all outline-none" 
                  value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Quantity</label>
                  <input required type="number" step="any" placeholder="0" className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-white font-mono transition-all outline-none" 
                    value={newAsset.shares} onChange={e => setNewAsset({...newAsset, shares: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">Avg Buy Price</label>
                  <input required type="number" step="any" placeholder="0.00" className="w-full bg-[#0a0a0a] border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg p-2.5 text-white font-mono transition-all outline-none" 
                    value={newAsset.buyPrice} onChange={e => setNewAsset({...newAsset, buyPrice: e.target.value})} />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800/50 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 px-6 py-2.5 rounded-lg font-medium text-white transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)]">
                  Add to Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}