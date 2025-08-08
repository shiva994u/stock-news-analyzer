// ==========================================
// src/services/realTimeGainersApi.js - REAL-TIME GAINERS SERVICE
// ==========================================

// Service that fetches real-time market gainers from multiple sources
export class RealTimeGainersService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes for real-time data
    this.requestTimeout = 10000; // 10 seconds timeout
  }

  // Main method to get real-time gainers
  async getTopGainers(options = {}) {
    const { limit = 15, minPercentChange = 1.0 } = options;

    console.log("🔄 Fetching REAL-TIME market gainers...");

    // Try multiple real-time sources in order of reliability
    const sources = [
      () => this.fetchFromYahooFinance(),
      () => this.fetchFromMarketWatch(),
      () => this.fetchFromCNBC(),
      () => this.fetchFromFinancialData(),
      () => this.fetchFromStockAnalysis(),
    ];

    for (let i = 0; i < sources.length; i++) {
      try {
        console.log(`🔍 Trying real-time source ${i + 1}...`);
        const gainers = await sources[i]();

        if (gainers && gainers.length > 0) {
          // Filter by minimum percentage change
          const filtered = gainers
            .filter(
              (stock) =>
                parseFloat(stock.change.replace("%", "").replace("+", "")) >=
                minPercentChange
            )
            .slice(0, limit);

          if (filtered.length > 0) {
            console.log(
              `✅ Got ${filtered.length} real-time gainers from source ${i + 1}`
            );
            return filtered;
          }
        }
      } catch (error) {
        console.warn(`Source ${i + 1} failed:`, error.message);
        continue;
      }
    }

    // If all real sources fail, return an error - no static fallback
    throw new Error("Unable to fetch real-time market data from any source");
  }

  // Method 1: Yahoo Finance Real-Time Gainers
  async fetchFromYahooFinance() {
    const cacheKey = "yahoo_realtime_gainers";
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Use Yahoo Finance's actual gainers screener endpoint
      const response = await this.makeRequest(
        "https://query1.finance.yahoo.com/v1/finance/screener",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
          body: JSON.stringify({
            size: 25,
            offset: 0,
            sortField: "percentchange",
            sortType: "desc",
            quoteType: "EQUITY",
            query: {
              operator: "and",
              operands: [
                { operator: "gt", operands: ["percentchange", 1.0] },
                { operator: "gt", operands: ["dayvolume", 100000] },
                { operator: "gt", operands: ["intradayprice", 5] },
              ],
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.finance?.result?.[0]?.quotes) {
          const gainers = this.parseYahooGainers(data.finance.result[0].quotes);
          this.setCached(cacheKey, gainers);
          return gainers;
        }
      }
      throw new Error("Yahoo Finance API returned invalid data");
    } catch (error) {
      throw new Error(`Yahoo Finance failed: ${error.message}`);
    }
  }

  // Method 2: Use CORS proxy for Yahoo Finance
  async fetchFromMarketWatch() {
    const cacheKey = "marketwatch_gainers";
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Try using a CORS proxy to access MarketWatch gainers
      const proxyUrl = "https://api.allorigins.win/get?url=";
      const targetUrl = encodeURIComponent(
        "https://www.marketwatch.com/tools/screener/gainers"
      );

      const response = await this.makeRequest(`${proxyUrl}${targetUrl}`);

      if (response.ok) {
        const data = await response.json();
        const gainers = this.parseMarketWatchHTML(data.contents);
        if (gainers.length > 0) {
          this.setCached(cacheKey, gainers);
          return gainers;
        }
      }
      throw new Error("MarketWatch proxy failed");
    } catch (error) {
      throw new Error(`MarketWatch failed: ${error.message}`);
    }
  }

  // Method 3: CNBC Real-Time Data
  async fetchFromCNBC() {
    const cacheKey = "cnbc_gainers";
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Try CNBC's market data endpoint
      const response = await this.makeRequest(
        "https://api.cnbc.com/buffett/market-data/gainers?limit=25"
      );

      if (response.ok) {
        const data = await response.json();
        const gainers = this.parseCNBCGainers(data);
        if (gainers.length > 0) {
          this.setCached(cacheKey, gainers);
          return gainers;
        }
      }
      throw new Error("CNBC API failed");
    } catch (error) {
      throw new Error(`CNBC failed: ${error.message}`);
    }
  }

  // Method 4: Alternative Financial Data API
  async fetchFromFinancialData() {
    const cacheKey = "financial_data_gainers";
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Try alternative financial data APIs
      const endpoints = [
        "https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/gainers?apikey=demo",
        "https://sandbox.iexapis.com/stable/stock/market/list/gainers?token=Tpk_8ab8bbe2b3a34b6ca2e8b5f7d94e54ab",
        "https://api.twelvedata.com/market_movers/stocks?direction=gainers&apikey=demo",
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.makeRequest(endpoint);
          if (response.ok) {
            const data = await response.json();
            const gainers = this.parseGenericGainers(data, endpoint);
            if (gainers.length > 0) {
              this.setCached(cacheKey, gainers);
              return gainers;
            }
          }
        } catch (error) {
          continue;
        }
      }
      throw new Error("All financial data APIs failed");
    } catch (error) {
      throw new Error(`Financial Data APIs failed: ${error.message}`);
    }
  }

  // Method 5: Stock Analysis Websites
  async fetchFromStockAnalysis() {
    const cacheKey = "stock_analysis_gainers";
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Try scraping from financial websites that provide real-time data
      const proxyUrl = "https://corsproxy.io/?";
      const targetUrl = "https://stockanalysis.com/markets/gainers/";

      const response = await this.makeRequest(
        `${proxyUrl}${encodeURIComponent(targetUrl)}`
      );

      if (response.ok) {
        const html = await response.text();
        const gainers = this.parseStockAnalysisHTML(html);
        if (gainers.length > 0) {
          this.setCached(cacheKey, gainers);
          return gainers;
        }
      }
      throw new Error("Stock Analysis scraping failed");
    } catch (error) {
      throw new Error(`Stock Analysis failed: ${error.message}`);
    }
  }

  // Parse Yahoo Finance gainers
  parseYahooGainers(quotes) {
    return quotes.map((quote) => ({
      symbol: quote.symbol,
      name: quote.longName || quote.shortName || quote.symbol,
      price: `$${(quote.regularMarketPrice || quote.price || 0).toFixed(2)}`,
      change: `+${(quote.regularMarketChangePercent || 0).toFixed(2)}%`,
      changeAmount: (quote.regularMarketChange || 0).toFixed(2),
      changePercent: quote.regularMarketChangePercent || 0,
      volume: this.formatVolume(quote.regularMarketVolume || quote.volume),
      marketCap: this.formatMarketCap(quote.marketCap),
      sector: quote.sector || "Unknown",
      lastUpdate: new Date().toISOString(),
      source: "yahoo_finance_realtime",
    }));
  }

  // Parse MarketWatch HTML
  parseMarketWatchHTML(html) {
    const gainers = [];
    try {
      // Extract stock data from MarketWatch HTML structure
      const stockRegex =
        /<tr[^>]*>[\s\S]*?<td[^>]*>([A-Z]{1,5})<\/td>[\s\S]*?<td[^>]*>\$?([\d,]+\.?\d*)<\/td>[\s\S]*?<td[^>]*>\+?([\d.]+)%<\/td>/g;
      let match;

      while ((match = stockRegex.exec(html)) !== null && gainers.length < 20) {
        const [, symbol, price, changePercent] = match;
        gainers.push({
          symbol: symbol.trim(),
          name: `${symbol} Corp.`,
          price: `$${parseFloat(price.replace(/,/g, "")).toFixed(2)}`,
          change: `+${parseFloat(changePercent).toFixed(2)}%`,
          changePercent: parseFloat(changePercent),
          volume: "N/A",
          lastUpdate: new Date().toISOString(),
          source: "marketwatch_realtime",
        });
      }
    } catch (error) {
      console.warn("MarketWatch HTML parsing failed:", error);
    }
    return gainers;
  }

  // Parse CNBC gainers
  parseCNBCGainers(data) {
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name || `${stock.symbol} Corp.`,
      price: `$${(stock.last || 0).toFixed(2)}`,
      change: `+${(stock.change_pct || 0).toFixed(2)}%`,
      changePercent: stock.change_pct || 0,
      volume: this.formatVolume(stock.volume),
      lastUpdate: new Date().toISOString(),
      source: "cnbc_realtime",
    }));
  }

  // Parse generic financial API responses
  parseGenericGainers(data, endpoint) {
    const gainers = [];

    try {
      if (endpoint.includes("polygon.io")) {
        // Polygon.io format
        if (data.results) {
          data.results.forEach((stock) => {
            gainers.push({
              symbol: stock.ticker,
              name: `${stock.ticker} Corp.`,
              price: `$${(stock.value || 0).toFixed(2)}`,
              change: `+${(stock.change_percentage || 0).toFixed(2)}%`,
              changePercent: stock.change_percentage || 0,
              lastUpdate: new Date().toISOString(),
              source: "polygon_realtime",
            });
          });
        }
      } else if (endpoint.includes("iexapis.com")) {
        // IEX format
        if (Array.isArray(data)) {
          data.forEach((stock) => {
            gainers.push({
              symbol: stock.symbol,
              name: stock.companyName || `${stock.symbol} Corp.`,
              price: `$${(stock.latestPrice || 0).toFixed(2)}`,
              change: `+${((stock.changePercent || 0) * 100).toFixed(2)}%`,
              changePercent: (stock.changePercent || 0) * 100,
              volume: this.formatVolume(stock.latestVolume),
              lastUpdate: new Date().toISOString(),
              source: "iex_realtime",
            });
          });
        }
      } else if (endpoint.includes("twelvedata.com")) {
        // TwelveData format
        if (data.gainers) {
          data.gainers.forEach((stock) => {
            gainers.push({
              symbol: stock.symbol,
              name: stock.name || `${stock.symbol} Corp.`,
              price: `$${(stock.price || 0).toFixed(2)}`,
              change: `+${(stock.change_percentage || 0).toFixed(2)}%`,
              changePercent: stock.change_percentage || 0,
              lastUpdate: new Date().toISOString(),
              source: "twelvedata_realtime",
            });
          });
        }
      }
    } catch (error) {
      console.warn("Generic API parsing failed:", error);
    }

    return gainers;
  }

  // Parse Stock Analysis HTML
  parseStockAnalysisHTML(html) {
    const gainers = [];
    try {
      // Extract from table structure
      const tableRegex = /<tbody>[\s\S]*?<\/tbody>/;
      const tableMatch = html.match(tableRegex);

      if (tableMatch) {
        const rowRegex = /<tr>[\s\S]*?<\/tr>/g;
        const rows = tableMatch[0].match(rowRegex) || [];

        rows.forEach((row) => {
          const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
          const cells = [];
          let cellMatch;

          while ((cellMatch = cellRegex.exec(row)) !== null) {
            cells.push(cellMatch[1].replace(/<[^>]*>/g, "").trim());
          }

          if (cells.length >= 4) {
            const symbol = cells[0];
            const price = cells[1];
            const changePercent = cells[2];

            if (
              symbol &&
              price &&
              changePercent &&
              symbol.match(/^[A-Z]{1,5}$/)
            ) {
              gainers.push({
                symbol: symbol,
                name: `${symbol} Corp.`,
                price: price.startsWith("$") ? price : `$${price}`,
                change: changePercent.includes("%")
                  ? changePercent
                  : `+${changePercent}%`,
                changePercent: parseFloat(
                  changePercent.replace(/[^\d.-]/g, "")
                ),
                lastUpdate: new Date().toISOString(),
                source: "stockanalysis_realtime",
              });
            }
          }
        });
      }
    } catch (error) {
      console.warn("Stock Analysis HTML parsing failed:", error);
    }
    return gainers;
  }

  // Enhanced sentiment analysis for real-time data
  async analyzeBulkSentiment(stocks) {
    const sentimentResults = new Map();

    for (const stock of stocks) {
      try {
        const changePercent = parseFloat(
          stock.change.replace("%", "").replace("+", "")
        );

        // Calculate sentiment based on real-time data
        let sentimentScore = this.calculateRealTimeSentiment(
          stock,
          changePercent
        );

        // Add real market context
        const marketContext = this.getRealTimeMarketContext();
        sentimentScore = sentimentScore * 0.85 + marketContext * 0.15;

        // Ensure bounds
        sentimentScore = Math.min(1, Math.max(-1, sentimentScore));

        sentimentResults.set(stock.symbol, {
          score: sentimentScore,
          label: this.getSentimentLabel(sentimentScore),
          confidence: Math.abs(sentimentScore) * 100,
          lastUpdate: new Date().toISOString(),
          factors: {
            priceChange: changePercent,
            volume: stock.volume,
            source: stock.source,
            marketTiming: marketContext,
            isRealTime: true,
          },
        });
      } catch (error) {
        console.error(
          `Real-time sentiment analysis failed for ${stock.symbol}:`,
          error
        );
        sentimentResults.set(stock.symbol, {
          score: 0,
          label: "Neutral",
          confidence: 50,
          lastUpdate: new Date().toISOString(),
          factors: { error: true, isRealTime: false },
        });
      }
    }

    return sentimentResults;
  }

  // Calculate sentiment for real-time data
  calculateRealTimeSentiment(stock, changePercent) {
    let score = 0;

    // Base score from price change (more aggressive for real-time)
    if (changePercent >= 10) score += 0.95;
    else if (changePercent >= 7) score += 0.8;
    else if (changePercent >= 5) score += 0.65;
    else if (changePercent >= 3) score += 0.45;
    else if (changePercent >= 2) score += 0.25;
    else if (changePercent >= 1) score += 0.1;

    // Volume factor (if available)
    if (stock.volume && stock.volume !== "N/A") {
      const volumeNum = this.parseVolume(stock.volume);
      if (volumeNum > 10000000) score += 0.1;
      else if (volumeNum > 5000000) score += 0.05;
    }

    // Real-time source reliability bonus
    const sourceBonus = {
      yahoo_finance_realtime: 0.1,
      cnbc_realtime: 0.08,
      polygon_realtime: 0.06,
      iex_realtime: 0.05,
    };
    score += sourceBonus[stock.source] || 0;

    return score;
  }

  // Get real-time market context
  getRealTimeMarketContext() {
    const now = new Date();
    const easternTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const hour = easternTime.getHours();
    const minute = easternTime.getMinutes();
    const day = easternTime.getDay();

    let contextScore = 0;

    // Market hours context (9:30 AM - 4:00 PM ET)
    const isMarketHours =
      (hour > 9 || (hour === 9 && minute >= 30)) && hour < 16;
    const isMarketDay = day >= 1 && day <= 5;

    if (isMarketHours && isMarketDay) {
      contextScore = 0.2; // Strong positive during market hours
    } else if (isMarketDay) {
      contextScore = 0.1; // Moderate during pre/after market
    } else {
      contextScore = -0.1; // Slightly negative on weekends
    }

    // Time-of-day adjustments
    if (isMarketHours) {
      if (hour === 9)
        contextScore += 0.1; // Market open excitement
      else if (hour === 15 && minute >= 30)
        contextScore += 0.15; // Market close activity
      else if (hour === 12) contextScore -= 0.05; // Lunch lull
    }

    return contextScore;
  }

  // Utility methods
  parseVolume(volumeStr) {
    if (!volumeStr || volumeStr === "N/A") return 0;
    const num = parseFloat(volumeStr.replace(/[^\d.]/g, ""));
    if (volumeStr.includes("M")) return num * 1000000;
    if (volumeStr.includes("K")) return num * 1000;
    return num;
  }

  formatVolume(volume) {
    if (!volume || volume === 0) return "N/A";

    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  }

  formatMarketCap(marketCap) {
    if (!marketCap || marketCap === 0) return null;

    if (marketCap >= 1000000000000) {
      return `$${(marketCap / 1000000000000).toFixed(1)}T`;
    } else if (marketCap >= 1000000000) {
      return `$${(marketCap / 1000000000).toFixed(1)}B`;
    } else if (marketCap >= 1000000) {
      return `$${(marketCap / 1000000).toFixed(1)}M`;
    }
    return `$${marketCap}`;
  }

  getSentimentLabel(score) {
    if (score > 0.2) return "Positive";
    if (score < -0.2) return "Negative";
    return "Neutral";
  }

  // HTTP request with timeout and proper error handling
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        throw new Error("Request timeout");
      }
      throw error;
    }
  }

  // Cache management
  getCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCached(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clearCache() {
    this.cache.clear();
    console.log("🧹 Real-time gainers cache cleared");
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      cacheTimeout: this.cacheTimeout,
      lastUpdate: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const realTimeGainersService = new RealTimeGainersService();

// Debug access
if (typeof window !== "undefined") {
  window.realTimeGainersService = realTimeGainersService;
}
