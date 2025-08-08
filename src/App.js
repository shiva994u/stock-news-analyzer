// ==========================================
// src/App.js - COMPLETE ENHANCED APPLICATION COMPONENT
// ==========================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, TrendingUp, FileText, Download, RefreshCw, Calendar, ExternalLink, AlertCircle, CheckCircle, Clock, Star, BarChart3, Users, Globe, Zap, ArrowUp, ArrowDown, Activity } from 'lucide-react';
import { EnhancedNewsService } from './services/newsApi';
import { realTimeGainersService } from './services/realTimeGainersApi';
import { exportToCSV, formatDate, getSentimentColor, getSentimentIcon, getCategoryColor } from './utils/helpers';
import './App.css';

const StockNewsApp = () => {
  // State management
  const [stocks, setStocks] = useState([]);
  const [topGainers, setTopGainers] = useState([]);
  const [selectedStock, setSelectedStock] = useState('');
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGainers, setLoadingGainers] = useState(false);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('comprehensive');
  const [timeRange, setTimeRange] = useState('1d');
  const [sentiment, setSentiment] = useState(null);
  const [apiSources, setApiSources] = useState([]);
  const [stockSentiments, setStockSentiments] = useState(new Map());

  // Initialize news service only once
  const newsServiceRef = useRef(null);
  if (!newsServiceRef.current) {
    newsServiceRef.current = new EnhancedNewsService();
  }

  // Fetch REAL-TIME market gainers (no static data)
  const fetchYahooGainers = useCallback(async () => {
    // Prevent duplicate calls
    if (loadingGainers) {
      console.log('⏳ Real-time gainers fetch already in progress, skipping...');
      return;
    }

    setLoadingGainers(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching REAL-TIME market gainers (no static data)...');
      
      // Use the real-time service that fetches actual current gainers
      const gainers = await realTimeGainersService.getTopGainers({
        limit: 15,
        minPercentChange: 1.0
      });
      
      if (gainers && gainers.length > 0) {
        setTopGainers(gainers);
        console.log(`✅ Fetched ${gainers.length} REAL-TIME gainers successfully`);
        
        // Determine data source for user feedback
        const isRealTimeData = gainers.some(g => g.source && g.source.includes('realtime'));
        if (isRealTimeData) {
          setError(null); // Clear any previous errors
          console.log('📊 Using live real-time market data');
        } else {
          setError('Real-time APIs temporarily unavailable. Please try refreshing.');
          console.log('⚠️ Real-time APIs failed');
        }
        
        // Auto-analyze sentiment for real-time gainers
        try {
          const sentimentResults = await realTimeGainersService.analyzeBulkSentiment(gainers);
          setStockSentiments(sentimentResults);
          console.log(`✅ Analyzed sentiment for ${sentimentResults.size} real-time stocks`);
        } catch (sentimentError) {
          console.warn('⚠️ Real-time sentiment analysis failed:', sentimentError);
          // Continue without sentiment data
        }
      } else {
        throw new Error('No real-time gainers data received');
      }
      
    } catch (error) {
      console.error('❌ Error fetching real-time gainers:', error);
      setError(`Unable to fetch real-time market data: ${error.message}. Please check your internet connection and try again.`);
      
      // Clear existing data since we don't want static fallback
      setTopGainers([]);
      setStockSentiments(new Map());
      console.log('🚫 No static fallback - real-time data only');
    } finally {
      setLoadingGainers(false);
    }
  }, [loadingGainers]);

  // Enhanced fetch function with duplicate prevention and better error handling
  const fetchStockNews = useCallback(async (symbol, days = 7) => {
    // Prevent duplicate calls for the same symbol
    if (loading && selectedStock === symbol) {
      console.log(`⏳ News fetch for ${symbol} already in progress, skipping...`);
      return;
    }

    setLoading(true);
    setError(null);
    setApiSources([]);
    setSelectedStock(symbol);
    
    try {
      console.log(`🔄 Fetching news for ${symbol}...`);
      
      const result = await newsServiceRef.current.getComprehensiveNews(symbol, {
        limit: 20,
        days: parseInt(days),
        preferredSources: ['marketaux', 'finnhub', 'stocknewsapi', 'alphavantage']
      });
      
      console.log('📊 Fetch result:', result);
      
      // Update state with results
      setNewsData(result.articles || []);
      setSentiment(result.sentiment);
      setApiSources(result.sources || []);
      
      // Show success message
      const successfulSources = result.sources?.filter(s => s.status === 'success') || [];
      if (successfulSources.length > 0) {
        console.log(`✅ Successfully fetched from ${successfulSources.length} source(s):`, 
          successfulSources.map(s => s.name).join(', '));
      } else {
        setError('Using demo news data. Configure API keys in .env file for real-time news.');
      }
      
      // Show warnings if some APIs failed
      if (result.errors && result.errors.length > 0) {
        const errorMsg = `Note: Using ${successfulSources.length} of ${result.sources.length} data sources.`;
        if (successfulSources.length === 0) {
          setError('Demo news data loaded. Add API keys for live news feeds.');
        } else {
          setError(errorMsg);
        }
        console.warn('⚠️ Some APIs failed:', result.errors);
      }
      
      // Add to stocks list if not exists (prevent duplicates)
      if (!stocks.includes(symbol)) {
        setStocks(prev => {
          const newStocks = [...prev, symbol];
          return newStocks.slice(-20); // Keep last 20
        });
      }
      
    } catch (err) {
      console.error('❌ News fetch error:', err);
      setError(`Unable to fetch news for ${symbol}. Showing demo articles.`);
      
      // Don't clear existing data on error, just show error message
      if (newsData.length === 0) {
        console.log('📝 Loading demo news data...');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, selectedStock, stocks, newsData.length]);

  // Fetch gainers when component mounts (only once)
  useEffect(() => {
    // Only fetch if we don't have data and not currently loading
    if (topGainers.length === 0 && !loadingGainers) {
      fetchYahooGainers();
    }
  }, []); // Empty dependency array - only run once on mount

  // Handle stock selection with duplicate prevention
  const handleStockSelection = useCallback((symbol) => {
    if (!symbol || !symbol.trim()) return;
    
    const cleanSymbol = symbol.toUpperCase().trim();
    
    // Prevent duplicate selection
    if (selectedStock === cleanSymbol && !loading) {
      console.log(`📌 ${cleanSymbol} already selected`);
      return;
    }
    
    const days = parseInt(timeRange.replace('d', ''));
    fetchStockNews(cleanSymbol, days);
  }, [selectedStock, loading, timeRange, fetchStockNews]);

  // Handle manual search with validation
  const handleStockSearch = useCallback((symbol) => {
    if (!symbol || !symbol.trim()) {
      setError('Please enter a valid stock symbol');
      return;
    }
    
    const cleanSymbol = symbol.toUpperCase().trim();
    
    // Basic validation
    if (!/^[A-Z]{1,5}$/.test(cleanSymbol)) {
      setError('Stock symbol should be 1-5 letters only');
      return;
    }
    
    handleStockSelection(cleanSymbol);
  }, [handleStockSelection]);

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
                <p className="text-gray-600">Real-time financial news and sentiment tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : loadingGainers ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                  {loading ? 'Fetching News...' : loadingGainers ? 'Loading Gainers...' : 'Ready'}
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
        {/* Debug Panel - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-xl p-4 mb-8 text-xs">
            <h4 className="font-semibold text-gray-700 mb-2">🔧 Debug Info</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <strong>Loading States:</strong><br/>
                Gainers: {loadingGainers ? '⏳' : '✅'}<br/>
                News: {loading ? '⏳' : '✅'}
              </div>
              <div>
                <strong>Data Status:</strong><br/>
                Gainers: {topGainers.length}<br/>
                News: {newsData.length}
              </div>
              <div>
                <strong>Selected:</strong><br/>
                Stock: {selectedStock || 'None'}<br/>
                Range: {timeRange}
              </div>
              <div>
                <strong>Real-Time Service:</strong><br/>
                Source: {topGainers.length > 0 && topGainers[0].source?.includes('realtime') ? '🔴 Live' : '❌ Failed'}<br/>
                Cache: <button 
                  onClick={() => {
                    realTimeGainersService.clearCache();
                    console.log('Real-time service cache cleared');
                  }}
                  className="text-blue-600 underline"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Source Indicator */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                topGainers.length > 0 && topGainers[0].source?.includes('realtime') ? 'bg-red-500' : 'bg-gray-500'
              }`}></div>
              <div>
                <h4 className="font-semibold text-gray-800">
                  {topGainers.length > 0 && topGainers[0].source?.includes('realtime')
                    ? '🔴 Live Real-Time Market Data' 
                    : '❌ Real-Time Data Unavailable'}
                </h4>
                <p className="text-sm text-gray-600">
                  {topGainers.length > 0 && topGainers[0].source?.includes('realtime')
                    ? 'Current market gainers from live financial data feeds'
                    : 'Unable to connect to real-time market data sources'}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              Last updated: {topGainers[0]?.lastUpdate ? new Date(topGainers[0].lastUpdate).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>

        {/* Market Gainers Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={24} className="text-green-500" />
              Today's Top Gainers
              {topGainers.length > 0 && !topGainers[0].source?.includes('realistic') && (
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">Live API</span>
              )}
              {topGainers.length > 0 && topGainers[0].source?.includes('realistic') && (
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Enhanced</span>
              )}
              {loadingGainers && <RefreshCw className="animate-spin text-blue-500" size={20} />}
            </h3>
            <button
              onClick={() => {
                // Clear cache and force refresh from real-time service
                realTimeGainersService.clearCache();
                fetchYahooGainers();
              }}
              disabled={loadingGainers}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              <RefreshCw size={16} />
              {loadingGainers ? 'Fetching Real-Time...' : 'Refresh Live Data'}
            </button>
          </div>

          {loadingGainers ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 rounded-lg p-4">
                    <div className="h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : topGainers.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="mx-auto text-red-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">No real-time market data available</p>
              <p className="text-sm text-gray-500 mb-4">Unable to connect to live market data sources</p>
              <button
                onClick={fetchYahooGainers}
                disabled={loadingGainers}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {topGainers.map((stock, index) => {
                const stockSentiment = stockSentiments.get(stock.symbol);
                return (
                  <div
                    key={stock.symbol}
                    onClick={() => handleStockSelection(stock.symbol)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg transform hover:-translate-y-1 ${
                      selectedStock === stock.symbol 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-gray-900">{stock.symbol}</span>
                      <span className="text-green-600 font-semibold flex items-center gap-1">
                        <ArrowUp size={14} />
                        {stock.change}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2 truncate">
                      {stock.name}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900">{stock.price}</span>
                      {stock.volume && (
                        <span className="text-gray-500 text-xs">Vol: {stock.volume}</span>
                      )}
                    </div>

                    {/* Sentiment indicator */}
                    {stockSentiment && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(stockSentiment.score)}`}>
                          {getSentimentIcon(stockSentiment.score)}
                          {stockSentiment.label}
                          <span className="text-xs opacity-75">
                            ({Math.round(stockSentiment.confidence)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Stock Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manual Stock Search
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter stock symbol (e.g., AAPL)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleStockSearch(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    handleStockSearch(input.value);
                    input.value = '';
                  }}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />}
                  Search
                </button>
              </div>
              
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Click on any gainer above or search manually</p>
                <p className="text-xs text-gray-500">News will be fetched only when you select a stock</p>
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

        {/* Current Selection Info */}
        {selectedStock && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-8 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <FileText size={18} />
              Analyzing: {selectedStock}
            </h4>
            <p className="text-blue-700 text-sm">
              {loading ? 'Fetching latest news and sentiment analysis...' : `Showing ${newsData.length} articles with sentiment analysis`}
            </p>
          </div>
        )}

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
        {sentiment && selectedStock && (
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
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle size={20} />
              <span className="font-medium">Real-Time Data Issue:</span>
              <span>{error}</span>
            </div>
            <p className="text-sm text-red-700 mt-2">
              💡 Real-time market data requires active API connections. Try refreshing or check your internet connection.
            </p>
          </div>
        )}

        {/* News Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText size={24} />
                {selectedStock ? `News Analysis - ${selectedStock}` : 'Select a Stock for News Analysis'}
                {loading && <RefreshCw className="animate-spin text-blue-500" size={20} />}
              </h3>
              {selectedStock && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStockSelection(selectedStock)}
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
              )}
            </div>
            
            {/* Summary Stats */}
            {newsData.length > 0 && (
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
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
          ) : newsData.length === 0 && selectedStock ? (
            <div className="p-12 text-center">
              <FileText className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">No news articles found for {selectedStock}</p>
              <p className="text-sm text-gray-500">Try a different stock symbol or check your API configuration</p>
            </div>
          ) : selectedStock ? (
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
          ) : (
            <div className="p-12 text-center">
              <Search className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 mb-2">Select a stock to view news analysis</p>
              <p className="text-sm text-gray-500">Click on any gainer above or search manually</p>
            </div>
          )}
        </div>

        {/* Setup Instructions */}
        {topGainers.length === 0 && !loadingGainers && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <Zap size={20} />
              Real-Time Data Sources
            </h4>
            <p className="text-blue-700 mb-4">
              This app fetches live market gainers from multiple real-time sources:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">🔴 Yahoo Finance</h5>
                <p className="text-sm text-gray-600 mb-2">Live screener data from Yahoo Finance</p>
                <p className="text-xs text-gray-500">Real-time market gainers</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">📊 CNBC Markets</h5>
                <p className="text-sm text-gray-600 mb-2">Professional market data feeds</p>
                <p className="text-xs text-gray-500">Live financial data</p>
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-4">
              ⚠️ Real-time data depends on external API availability and may require network connectivity.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm mb-2">
            Built with React • Multiple news APIs • Real-time sentiment analysis • Live market data feeds
          </p>
          <p className="text-xs text-gray-500">
            Real-time gainers from live market sources • Click stocks to fetch news • No static data used
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockNewsApp;