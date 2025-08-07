// ==========================================
// src/services/newsApi.js - ENHANCED NEWS SERVICE
// ==========================================

// Enhanced news service with multiple free API integrations
export class EnhancedNewsService {
  constructor() {
    this.apis = {
      marketaux: {
        name: 'Marketaux',
        baseUrl: 'https://www.marketaux.com/api/v1',
        key: process.env.REACT_APP_MARKETAUX_API_KEY,
        dailyLimit: 100,
        features: ['sentiment', 'entities', 'multilingual']
      },
      finnhub: {
        name: 'Finnhub',
        baseUrl: 'https://finnhub.io/api/v1',
        key: process.env.REACT_APP_FINNHUB_API_KEY,
        minuteLimit: 60,
        features: ['realtime', 'websocket', 'global']
      },
      stocknewsapi: {
        name: 'Stock News API',
        baseUrl: 'https://stocknewsapi.com/api/v1',
        key: process.env.REACT_APP_STOCKNEWS_API_KEY,
        dailyLimit: 100,
        features: ['sentiment', 'topics', 'historical']
      },
      alphavantage: {
        name: 'Alpha Vantage',
        baseUrl: 'https://www.alphavantage.co/query',
        key: process.env.REACT_APP_ALPHAVANTAGE_API_KEY,
        dailyLimit: 25,
        features: ['sentiment', 'technical', 'economic']
      }
    };

    // CORS proxy for development (remove in production)
    this.corsProxy = process.env.NODE_ENV === 'development' ? '' : '';
  }

  // Marketaux API - Best for sentiment analysis
  async fetchFromMarketaux(symbol, options = {}) {
    const { limit = 20, language = 'en' } = options;
    
    if (!this.apis.marketaux.key || this.apis.marketaux.key === 'your_marketaux_api_key_here') {
      throw new Error('Marketaux API key not configured');
    }

    try {
      const params = new URLSearchParams({
        symbols: symbol,
        filter_entities: 'true',
        language: language,
        limit: limit.toString(),
        api_token: this.apis.marketaux.key
      });

      const url = `${this.corsProxy}${this.apis.marketaux.baseUrl}/news/all?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Marketaux API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Marketaux API error: ${data.error.message || 'Unknown error'}`);
      }
      
      return {
        source: 'Marketaux',
        articles: (data.data || []).map(article => ({
          id: article.uuid,
          title: article.title,
          description: article.description || article.snippet || '',
          source: article.source,
          publishedAt: article.published_at,
          url: article.url,
          sentiment: this.extractMarketauxSentiment(article),
          category: this.categorizeNews(article.title),
          confidence: article.entities?.[0]?.match_score || 0,
          highlights: article.entities?.[0]?.highlights || [],
          imageUrl: article.image_url
        })),
        meta: data.meta || {}
      };
    } catch (error) {
      console.error('Marketaux API error:', error);
      throw error;
    }
  }

  // Finnhub API - Best for real-time data
  async fetchFromFinnhub(symbol, options = {}) {
    const { days = 7 } = options;
    
    if (!this.apis.finnhub.key || this.apis.finnhub.key === 'your_finnhub_api_key_here') {
      throw new Error('Finnhub API key not configured');
    }

    try {
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = new Date().toISOString().split('T')[0];

      const params = new URLSearchParams({
        symbol: symbol,
        from: fromDate,
        to: toDate,
        token: this.apis.finnhub.key
      });

      const url = `${this.corsProxy}${this.apis.finnhub.baseUrl}/company-news?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status} - ${response.statusText}`);
      }

      const articles = await response.json();
      
      if (!Array.isArray(articles)) {
        throw new Error('Finnhub API returned invalid data');
      }
      
      return {
        source: 'Finnhub',
        articles: articles.map((article, index) => ({
          id: article.id || `finnhub_${index}`,
          title: article.headline,
          description: article.summary || '',
          source: article.source,
          publishedAt: new Date(article.datetime * 1000).toISOString(),
          url: article.url,
          sentiment: this.calculateSentiment(article.headline + ' ' + (article.summary || '')),
          category: this.categorizeNews(article.headline),
          confidence: 85,
          imageUrl: article.image
        })),
        meta: { total: articles.length }
      };
    } catch (error) {
      console.error('Finnhub API error:', error);
      throw error;
    }
  }

  // Stock News API - Best for US markets
  async fetchFromStockNewsAPI(symbol, options = {}) {
    const { limit = 20 } = options;
    
    if (!this.apis.stocknewsapi.key || this.apis.stocknewsapi.key === 'your_stocknews_api_key_here') {
      throw new Error('Stock News API key not configured');
    }

    try {
      const params = new URLSearchParams({
        tickers: symbol,
        items: limit.toString(),
        token: this.apis.stocknewsapi.key
      });

      const url = `${this.corsProxy}${this.apis.stocknewsapi.baseUrl}?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Stock News API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`Stock News API error: ${data.error}`);
      }
      
      return {
        source: 'Stock News API',
        articles: (data.data || []).map(article => ({
          id: article.news_url,
          title: article.title,
          description: article.text || '',
          source: article.source_name,
          publishedAt: article.date,
          url: article.news_url,
          sentiment: this.normalizeSentiment(article.sentiment),
          category: this.categorizeNews(article.title),
          confidence: 90,
          imageUrl: article.image_url,
          topics: article.topics || []
        })),
        meta: { total: data.total || 0 }
      };
    } catch (error) {
      console.error('Stock News API error:', error);
      throw error;
    }
  }

  // Alpha Vantage - Best for sentiment analysis
  async fetchFromAlphaVantage(symbol, options = {}) {
    const { limit = 20 } = options;
    
    if (!this.apis.alphavantage.key || this.apis.alphavantage.key === 'your_alphavantage_api_key_here') {
      throw new Error('Alpha Vantage API key not configured');
    }

    try {
      const params = new URLSearchParams({
        function: 'NEWS_SENTIMENT',
        tickers: symbol,
        limit: limit.toString(),
        apikey: this.apis.alphavantage.key
      });

      const url = `${this.corsProxy}${this.apis.alphavantage.baseUrl}?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`);
      }

      if (data.Information) {
        throw new Error(`Alpha Vantage API rate limit: ${data.Information}`);
      }
      
      return {
        source: 'Alpha Vantage',
        articles: (data.feed || []).map(article => ({
          id: article.url,
          title: article.title,
          description: article.summary || '',
          source: article.source,
          publishedAt: this.convertAlphaVantageTime(article.time_published),
          url: article.url,
          sentiment: parseFloat(article.overall_sentiment_score || 0),
          category: this.categorizeNews(article.title),
          confidence: Math.abs(parseFloat(article.overall_sentiment_score || 0)) * 100,
          relevanceScore: parseFloat(article.relevance_score || 0)
        })),
        meta: { 
          overall_sentiment: data.overall_sentiment_score,
          sentiment_label: data.overall_sentiment_label
        }
      };
    } catch (error) {
      console.error('Alpha Vantage API error:', error);
      throw error;
    }
  }

  // Comprehensive news fetcher with multiple APIs
  async getComprehensiveNews(symbol, options = {}) {
    const { limit = 20, days = 7, preferredSources = ['marketaux', 'finnhub', 'stocknewsapi'] } = options;
    
    const results = {
      symbol,
      articles: [],
      sources: [],
      errors: [],
      sentiment: null,
      timestamp: new Date().toISOString()
    };

    // Filter to only try APIs that have keys configured
    const availableSources = preferredSources.filter(source => {
      const api = this.apis[source];
      return api?.key && api.key !== `your_${source}_api_key_here` && api.key !== 'your_key_here';
    });

    console.log('Available APIs:', availableSources);

    // Try multiple APIs in parallel
    const apiPromises = [];

    for (const source of availableSources) {
      let promise;
      
      switch (source) {
        case 'marketaux':
          promise = this.fetchFromMarketaux(symbol, { limit: Math.ceil(limit / availableSources.length) });
          break;
        case 'finnhub':
          promise = this.fetchFromFinnhub(symbol, { days });
          break;
        case 'stocknewsapi':
          promise = this.fetchFromStockNewsAPI(symbol, { limit: Math.ceil(limit / availableSources.length) });
          break;
        case 'alphavantage':
          promise = this.fetchFromAlphaVantage(symbol, { limit: Math.ceil(limit / availableSources.length) });
          break;
        default:
          continue;
      }

      apiPromises.push(
        promise
          .then(data => ({ success: true, source, data }))
          .catch(error => ({ success: false, source, error: error.message }))
      );
    }

    // If no APIs are configured, return mock data
    if (apiPromises.length === 0) {
      console.warn('No API keys configured, using mock data');
      return this.getMockNews(symbol);
    }

    try {
      const responses = await Promise.all(apiPromises);
      
      // Process successful responses
      responses.forEach(response => {
        if (response.success) {
          results.sources.push({
            name: response.source,
            status: 'success',
            count: response.data.articles.length
          });
          results.articles.push(...response.data.articles);
        } else {
          results.sources.push({
            name: response.source,
            status: 'error',
            error: response.error
          });
          results.errors.push(`${response.source}: ${response.error}`);
        }
      });

      // If no successful sources, return mock data
      if (results.articles.length === 0) {
        console.warn('All APIs failed, using mock data');
        return this.getMockNews(symbol);
      }

      // Remove duplicates and sort
      results.articles = this.deduplicateArticles(results.articles)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, limit);

      // Calculate overall sentiment
      results.sentiment = this.calculateOverallSentiment(results.articles);

      return results;

    } catch (error) {
      console.error('Comprehensive news fetch error:', error);
      // Fallback to mock data
      return this.getMockNews(symbol);
    }
  }

  // Utility methods
  extractMarketauxSentiment(article) {
    const entity = article.entities?.[0];
    if (entity?.sentiment_score !== undefined) {
      return entity.sentiment_score;
    }
    return this.calculateSentiment(article.title + ' ' + (article.description || ''));
  }

  normalizeSentiment(sentiment) {
    if (typeof sentiment === 'string') {
      switch (sentiment.toLowerCase()) {
        case 'positive': return 0.5;
        case 'negative': return -0.5;
        case 'neutral': return 0;
        default: return 0;
      }
    }
    return sentiment || 0;
  }

  convertAlphaVantageTime(timeString) {
    // Convert YYYYMMDDTHHMMSS to ISO format
    if (timeString && timeString.length >= 15) {
      const year = timeString.substring(0, 4);
      const month = timeString.substring(4, 6);
      const day = timeString.substring(6, 8);
      const hour = timeString.substring(9, 11);
      const minute = timeString.substring(11, 13);
      const second = timeString.substring(13, 15);
      
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }
    return new Date().toISOString();
  }

  calculateSentiment(text) {
    if (!text) return 0;
    
    const positiveWords = [
      'beat', 'strong', 'growth', 'profit', 'gain', 'rise', 'up', 'positive', 
      'good', 'success', 'win', 'boost', 'improve', 'bullish', 'upgrade', 
      'buy', 'outperform', 'exceed', 'higher', 'increase', 'rally', 'surge'
    ];
    
    const negativeWords = [
      'miss', 'weak', 'loss', 'fall', 'down', 'negative', 'bad', 'fail', 
      'drop', 'decline', 'bearish', 'concern', 'risk', 'downgrade', 'sell', 
      'underperform', 'lower', 'decrease', 'crash', 'plunge', 'warning'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    let wordCount = 0;
    
    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) {
        score += 0.1;
        wordCount++;
      }
      if (negativeWords.some(neg => word.includes(neg))) {
        score -= 0.1;
        wordCount++;
      }
    });
    
    // Normalize by word count to avoid bias towards longer texts
    if (wordCount > 0) {
      score = score / Math.sqrt(wordCount);
    }
    
    return Math.max(-1, Math.min(1, score));
  }

  categorizeNews(title) {
    if (!title) return 'corporate';
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.match(/earnings|revenue|profit|quarter|q[1-4]|fiscal/)) return 'earnings';
    if (titleLower.match(/analyst|upgrade|downgrade|target|rating|recommendation/)) return 'analyst';
    if (titleLower.match(/merger|acquisition|partnership|deal|joint venture/)) return 'partnership';
    if (titleLower.match(/regulatory|sec|investigation|lawsuit|compliance|fine/)) return 'regulatory';
    if (titleLower.match(/market|trading|volatility|stock|shares|price/)) return 'market';
    if (titleLower.match(/product|launch|innovation|technology|patent/)) return 'product';
    if (titleLower.match(/management|ceo|executive|leadership|appointment/)) return 'management';
    
    return 'corporate';
  }

  calculateOverallSentiment(articles) {
    if (!articles || articles.length === 0) return null;
    
    const sentiments = articles
      .map(article => article.sentiment)
      .filter(s => s !== null && s !== undefined && !isNaN(s) && typeof s === 'number');
    
    if (sentiments.length === 0) return null;
    
    const avgSentiment = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    
    return {
      score: avgSentiment,
      label: avgSentiment > 0.2 ? 'Positive' : avgSentiment < -0.2 ? 'Negative' : 'Neutral',
      confidence: Math.abs(avgSentiment) * 100,
      distribution: {
        positive: sentiments.filter(s => s > 0.2).length,
        neutral: sentiments.filter(s => s >= -0.2 && s <= 0.2).length,
        negative: sentiments.filter(s => s < -0.2).length
      }
    };
  }

  deduplicateArticles(articles) {
    const seen = new Set();
    return articles.filter(article => {
      // Create a key from title (first 50 chars) and source
      const key = `${article.title?.toLowerCase().substring(0, 50)}_${article.source}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  getMockNews(symbol) {
    const mockArticles = [
      {
        id: 'mock_1',
        title: `${symbol} Reports Strong Q4 Earnings, Revenue Beats Expectations`,
        description: `${symbol} announced quarterly earnings that exceeded analyst expectations, driven by strong revenue growth and improved operational efficiency. The company showed resilience in challenging market conditions.`,
        source: 'Demo Financial News',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        url: '#',
        sentiment: 0.8,
        category: 'earnings',
        confidence: 85
      },
      {
        id: 'mock_2',
        title: `Wall Street Analysts Upgrade ${symbol} Price Target on Innovation Push`,
        description: `Multiple Wall Street analysts have raised their price targets for ${symbol} following the company's latest product innovation announcement and strategic market expansion plans.`,
        source: 'Demo Market Watch',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        url: '#',
        sentiment: 0.6,
        category: 'analyst',
        confidence: 90
      },
      {
        id: 'mock_3',
        title: `${symbol} Faces New Regulatory Scrutiny Over Market Practices`,
        description: `Regulatory authorities are examining ${symbol}'s business practices amid growing concerns from competitors and consumer advocacy groups about market dominance.`,
        source: 'Demo Regulatory Times',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        url: '#',
        sentiment: -0.3,
        category: 'regulatory',
        confidence: 75
      },
      {
        id: 'mock_4',
        title: `${symbol} Announces Strategic Partnership for AI Development`,
        description: `${symbol} has entered into a strategic partnership with leading technology firms to accelerate artificial intelligence development and integration across its product portfolio.`,
        source: 'Demo Tech News',
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        url: '#',
        sentiment: 0.7,
        category: 'partnership',
        confidence: 88
      },
      {
        id: 'mock_5',
        title: `${symbol} Stock Shows Resilience Amid Market Volatility`,
        description: `${symbol} shares demonstrated strong performance this week despite broader market uncertainty, with institutional investors showing continued confidence in the company's long-term strategy.`,
        source: 'Demo Investment Journal',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        url: '#',
        sentiment: 0.4,
        category: 'market',
        confidence: 80
      },
      {
        id: 'mock_6',
        title: `${symbol} Board Approves Major Share Buyback Program`,
        description: `The company's board of directors has approved a significant share repurchase program, signaling strong confidence in future performance and commitment to shareholder value.`,
        source: 'Demo Corporate News',
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        url: '#',
        sentiment: 0.5,
        category: 'corporate',
        confidence: 82
      }
    ];

    return {
      symbol,
      articles: mockArticles,
      sources: [{ name: 'Demo Data', status: 'success', count: mockArticles.length }],
      errors: [],
      sentiment: this.calculateOverallSentiment(mockArticles),
      timestamp: new Date().toISOString()
    };
  }
}
