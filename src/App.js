// ==========================================
// src/App.js - MAIN APPLICATION COMPONENT
// ==========================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, FileText, Download, RefreshCw, Calendar, ExternalLink, AlertCircle, CheckCircle, Clock, Star, BarChart3, Users, Globe, Zap } from 'lucide-react';
import { EnhancedNewsService } from './services/newsApi';
import { exportToCSV, formatDate, getSentimentColor, getSentimentIcon, getCategoryColor } from './utils/helpers';
import './App.css';

const StockNewsApp = () => {
  // State management
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('comprehensive');
  const [timeRange, setTimeRange] = useState('1d');
  const [sentiment, setSentiment] = useState(null);
  const [apiSources, setApiSources] = useState([]);

  // Popular stocks for quick selection
  const popularStocks = [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT',
    'UNH', 'PG', 'JNJ', 'HD', 'CVX', 'MA', 'PFE', 'BAC', 'KO', 'PEP'
  ];

  // Initialize news service only once
  const newsServiceRef = useRef(null);
  if (!newsServiceRef.current) {
    newsServiceRef.current = new EnhancedNewsService();
  }

  // Enhanced fetch function with multiple APIs
  const fetchStockNews = useCallback(async (symbol, days = 7) => {
    setLoading(true);
    setError(null);
    setApiSources([]);
    try {
      console.log(`Fetching news for ${symbol}...`);
      const result = await newsServiceRef.current.getComprehensiveNews(symbol, {
        limit: 20,
        days: parseInt(days),
        preferredSources: ['marketaux', 'finnhub', 'stocknewsapi', 'alphavantage']
      });
      console.log('Fetch result:', result);
      // Update state with results
      setNewsData(result.articles || []);
      setSentiment(result.sentiment);
      setApiSources(result.sources || []);
      // Show success message
      const successfulSources = result.sources?.filter(s => s.status === 'success') || [];
      if (successfulSources.length > 0) {
        console.log(`✅ Successfully fetched from ${successfulSources.length} source(s):`, 
          successfulSources.map(s => s.name).join(', '));
      }
      // Show warnings if some APIs failed
      if (result.errors && result.errors.length > 0) {
        const errorMsg = `Note: Using ${successfulSources.length} of ${result.sources.length} data sources. Some APIs may need configuration.`;
        setError(errorMsg);
        console.warn('⚠️ Some APIs failed:', result.errors);
      }
      // Add to stocks list if not exists
      if (!stocks.includes(symbol)) {
        setStocks(prev => [...prev, symbol].slice(0, 20)); // Keep last 20
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(`Failed to fetch news for ${symbol}: ${err.message}`);
      // Show fallback message
      console.log('📝 Using demo data - configure API keys for real data');
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  // Fetch news when component mounts or dependencies change
  useEffect(() => {
    if (selectedStock) {
      debugger
      const days = parseInt(timeRange.replace('d', ''));
      fetchStockNews(selectedStock, days);
    }
  }, [selectedStock, timeRange, fetchStockNews]);

  // Handle stock search
  const handleStockSearch = (symbol) => {
    if (symbol && symbol.trim()) {
      const cleanSymbol = symbol.toUpperCase().trim();
      setSelectedStock(cleanSymbol);
    }
  };

  // Handle CSV export
  const handleExport = () => {
    try {
      const csvData = exportToCSV(newsData, selectedStock);
      
      // Create and download file
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedStock}_news_analysis_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Export completed successfully');
    } catch (error) {
      console.error('❌ Export failed:', error);
      setError('Failed to export data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Stock News Analyzer
                </h1>
                <p className="text-gray-600">Real-time financial news and sentiment analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                  {loading ? 'Fetching Data...' : 'Ready'}
                </div>
              </div>
              {/* API Status Indicator */}
              {apiSources.length > 0 && (
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Sources: </span>
                  {apiSources.filter(s => s.status === 'success').length}/{apiSources.length}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stock Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Symbol
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value.toUpperCase())}
                  placeholder="Enter stock symbol (e.g., AAPL)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleStockSearch(selectedStock)}
                />
                <button
                  onClick={() => handleStockSearch(selectedStock)}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                  Search
                </button>
              </div>
              
              {/* Popular Stocks */}
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Popular stocks:</p>
                <div className="flex flex-wrap gap-2">
                  {popularStocks.slice(0, 8).map(stock => (
                    <button
                      key={stock}
                      onClick={() => setSelectedStock(stock)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedStock === stock 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {stock}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1d">Last 24 Hours</option>
                <option value="3d">Last 3 Days</option>
                <option value="7d">Last Week</option>
                <option value="14d">Last 2 Weeks</option>
                <option value="30d">Last Month</option>
              </select>
            </div>

            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="sentiment">Sentiment Only</option>
                <option value="earnings">Earnings Focus</option>
                <option value="analyst">Analyst Reports</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Sources Status */}
        {apiSources.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Globe size={16} />
              Data Sources Status
            </h4>
            <div className="flex flex-wrap gap-3">
              {apiSources.map((source, idx) => (
                <div key={idx} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
                  source.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {source.status === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  <span className="font-medium">{source.name}</span>
                  {source.count > 0 && <span>({source.count})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sentiment Overview */}
        {sentiment && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 size={24} />
              Sentiment Analysis for {selectedStock}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-lg font-bold ${
                  sentiment.label === 'Positive' ? 'bg-green-100 text-green-700' :
                  sentiment.label === 'Negative' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {sentiment.label === 'Positive' ? <TrendingUp size={20} /> :
                   sentiment.label === 'Negative' ? <AlertCircle size={20} /> :
                   <Clock size={20} />}
                  {sentiment.label}
                </div>
                <p className="text-sm text-gray-600 mt-2">Overall Sentiment</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {sentiment.confidence.toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Confidence</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sentiment.distribution.positive}
                </div>
                <p className="text-sm text-gray-600">Positive Articles</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {sentiment.distribution.negative}
                </div>
                <p className="text-sm text-gray-600">Negative Articles</p>
              </div>
            </div>

            {/* Sentiment Distribution Bar */}
            <div className="mt-6">
              <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 transition-all duration-500"
                  style={{ width: `${(sentiment.distribution.positive / newsData.length) * 100}%` }}
                ></div>
                <div 
                  className="bg-yellow-500 transition-all duration-500"
                  style={{ width: `${(sentiment.distribution.neutral / newsData.length) * 100}%` }}
                ></div>
                <div 
                  className="bg-red-500 transition-all duration-500"
                  style={{ width: `${(sentiment.distribution.negative / newsData.length) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>Positive ({sentiment.distribution.positive})</span>
                <span>Neutral ({sentiment.distribution.neutral})</span>
                <span>Negative ({sentiment.distribution.negative})</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle size={20} />
              <span className="font-medium">Info:</span>
              <span>{error}</span>
            </div>
            <p className="text-sm text-yellow-700 mt-2">
              💡 Configure API keys in .env file for real-time data. Currently showing demo data.
            </p>
          </div>
        )}

        {/* News Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={24} />
                News Analysis - {selectedStock}
                {loading && <RefreshCw className="animate-spin text-blue-500" size={20} />}
              </h3>
              <div className="flex gap-3">
                <button
                  onClick={() => fetchStockNews(selectedStock, parseInt(timeRange.replace('d', '')))}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button
                  onClick={handleExport}
                  disabled={loading || newsData.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <Download size={16} />
                  Export CSV
                </button>
              </div>
            </div>
            
            {/* Summary Stats */}
            {newsData.length > 0 && (
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FileText size={14} />
                  {newsData.length} articles
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  Last {timeRange}
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={14} />
                  {apiSources.filter(s => s.status === 'success').length} sources
                </span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="animate-spin mx-auto text-blue-500 mb-4" size={48} />
              <p className="text-gray-600">Fetching latest news for {selectedStock}...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
            </div>
          ) : newsData.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">No news articles found for {selectedStock}</p>
              <p className="text-sm text-gray-500">Try a different stock symbol or check your API configuration</p>
              <button
                onClick={() => handleStockSearch('AAPL')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try AAPL
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Article</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Source</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Published</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Sentiment</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {newsData.map((article, index) => (
                    <tr key={article.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="max-w-md">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {article.title}
                          </h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {article.description}
                          </p>
                          {article.confidence && (
                            <div className="mt-1 text-xs text-gray-500">
                              Confidence: {Math.round(article.confidence)}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">
                          {article.source}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {formatDate(article.publishedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(article.sentiment)}`}>
                          {getSentimentIcon(article.sentiment)}
                          {typeof article.sentiment === 'number' 
                            ? (article.sentiment > 0 ? '+' : '') + (article.sentiment * 100).toFixed(0) + '%'
                            : article.sentiment || 'Neutral'
                          }
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                          disabled={!article.url || article.url === '#'}
                        >
                          <ExternalLink size={14} />
                          Read
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        {newsData.length > 0 && apiSources.filter(s => s.status === 'success').length === 0 && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Zap size={20} />
              Get Real-Time Data
            </h4>
            <p className="text-blue-700 mb-4">
              You're currently viewing demo data. Get real-time financial news by configuring free API keys:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">🏆 Marketaux (Recommended)</h5>
                <p className="text-sm text-gray-600 mb-2">100 requests/day, sentiment analysis</p>
                <a 
                  href="https://www.marketaux.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Get Free API Key →
                </a>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">⚡ Finnhub</h5>
                <p className="text-sm text-gray-600 mb-2">60 requests/minute, real-time data</p>
                <a 
                  href="https://finnhub.io/register" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Get Free API Key →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm mb-2">
            Built with React • Multiple news APIs • Real-time sentiment analysis
          </p>
          <p className="text-xs text-gray-500">
            Configure API keys in .env file for live data • Open source on GitHub
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockNewsApp;
