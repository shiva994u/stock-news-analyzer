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
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 *
