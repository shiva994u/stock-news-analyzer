// ==========================================
// src/utils/helpers.js - UTILITY FUNCTIONS
// ==========================================

import { TrendingUp, AlertCircle, Clock } from 'lucide-react';

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // If less than 24 hours ago, show relative time
    if (diffHours < 24) {
      if (diffHours === 1) return '1 hour ago';
      return `${diffHours} hours ago`;
    }
    
    // If less than 7 days ago, show days
    if (diffDays < 7) {
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    }
    
    // Otherwise show formatted date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

// Get sentiment color classes
export const getSentimentColor = (sentiment) => {
  if (typeof sentiment === 'number') {
    if (sentiment > 0.2) return 'text-green-600 bg-green-100';
    if (sentiment < -0.2) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  }
  
  if (typeof sentiment === 'string') {
    const s = sentiment.toLowerCase();
    if (s === 'positive') return 'text-green-600 bg-green-100';
    if (s === 'negative') return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  }
  
  return 'text-gray-600 bg-gray-100';
};

// Get sentiment icon
export const getSentimentIcon = (sentiment) => {
  if (typeof sentiment === 'number') {
    if (sentiment > 0.2) return <TrendingUp size={16} />;
    if (sentiment < -0.2) return <AlertCircle size={16} />;
    return <Clock size={16} />;
  }
  
  if (typeof sentiment === 'string') {
    const s = sentiment.toLowerCase();
    if (s === 'positive') return <TrendingUp size={16} />;
    if (s === 'negative') return <AlertCircle size={16} />;
    return <Clock size={16} />;
  }
  
  return <Clock size={16} />;
};

// Get category color classes
export const getCategoryColor = (category) => {
  const colors = {
    earnings: 'bg-blue-100 text-blue-800',
    analyst: 'bg-purple-100 text-purple-800',
    regulatory: 'bg-red-100 text-red-800',
    partnership: 'bg-green-100 text-green-800',
    market: 'bg-yellow-100 text-yellow-800',
    corporate: 'bg-indigo-100 text-indigo-800',
    product: 'bg-orange-100 text-orange-800',
    management: 'bg-pink-100 text-pink-800'
  };
  return colors[category] || 'bg-gray-100 text-gray-800';
};

// Export data to CSV
export const exportToCSV = (articles, symbol) => {
  if (!articles || articles.length === 0) {
    throw new Error('No data to export');
  }

  const headers = [
    'Symbol',
    'Title',
    'Source',
    'Published Date',
    'Sentiment Score',
    'Sentiment Label',
    'Category',
    'Confidence',
    'Description',
    'URL'
  ];

  const rows = articles.map(article => [
    symbol,
    `"${(article.title || '').replace(/"/g, '""')}"`,
    `"${(article.source || '').replace(/"/g, '""')}"`,
    article.publishedAt || '',
    typeof article.sentiment === 'number' ? article.sentiment.toFixed(3) : article.sentiment || '',
    getSentimentLabel(article.sentiment),
    article.category || '',
    article.confidence || '',
    `"${(article.description || '').replace(/"/g, '""')}"`,
    article.url || ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  // Add BOM for proper Excel encoding
  return '\ufeff' + csvContent;
};

// Get sentiment label from score
export const getSentimentLabel = (sentiment) => {
  if (typeof sentiment === 'number') {
    if (sentiment > 0.2) return 'Positive';
    if (sentiment < -0.2) return 'Negative';
    return 'Neutral';
  }
  
  if (typeof sentiment === 'string') {
    return sentiment.charAt(0).toUpperCase() + sentiment.slice(1).toLowerCase();
  }
  
  return 'Neutral';
};

// Validate stock symbol
export const validateStockSymbol = (symbol) => {
  if (!symbol) return false;
  
  // Remove whitespace and convert to uppercase
  const cleanSymbol = symbol.trim().toUpperCase();
  
  // Check if it's 1-5 characters and contains only letters
  const symbolRegex = /^[A-Z]{1,5}$/;
  return symbolRegex.test(cleanSymbol);
};

// Debounce function for search input
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

// Format large numbers
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Get time of day greeting
export const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Check if market is open (simplified - US market hours)
export const isMarketOpen = () => {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  
  // Market closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM - 4:00 PM ET (simplified)
  return hour >= 9 && hour < 16;
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Parse API error messages
export const parseApiError = (error) => {
  if (typeof error === 'string') return error;
  
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  if (error?.statusText) return error.statusText;
  
  return 'An unexpected error occurred';
};

// Local storage helpers (with error handling)
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Error reading from localStorage:', error);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Error removing from localStorage:', error);
      return false;
    }
  }
};

// Theme helpers
export const theme = {
  colors: {
    primary: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a'
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706'
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626'
    }
  }
};

// API rate limiting helpers
export const rateLimiter = {
  limits: new Map(),
  
  canMakeRequest: (apiName, maxRequests = 100, windowMs = 24 * 60 * 60 * 1000) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimiter.limits.has(apiName)) {
      rateLimiter.limits.set(apiName, []);
    }
    
    const requests = rateLimiter.limits.get(apiName);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    rateLimiter.limits.set(apiName, validRequests);
    
    return true;
  },
  
  getRemainingRequests: (apiName, maxRequests = 100, windowMs = 24 * 60 * 60 * 1000) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimiter.limits.has(apiName)) {
      return maxRequests;
    }
    
    const requests = rateLimiter.limits.get(apiName);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
  getRemainingRequests: (apiName, maxRequests = 100, windowMs = 24 * 60 * 60 * 1000) => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimiter.limits.has(apiName)) {
      return maxRequests;
    }
    
    const requests = rateLimiter.limits.get(apiName);
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, maxRequests - validRequests.length);
  }
};

// Constants for the application
export const CONSTANTS = {
  API_ENDPOINTS: {
    MARKETAUX: 'https://www.marketaux.com/api/v1',
    FINNHUB: 'https://finnhub.io/api/v1',
    STOCKNEWS: 'https://stocknewsapi.com/api/v1',
    ALPHAVANTAGE: 'https://www.alphavantage.co/query'
  },
  
  DEFAULT_SYMBOLS: [
    'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM', 'V', 'WMT'
  ],
  
  TIME_RANGES: [
    { value: '1d', label: 'Last 24 Hours' },
    { value: '3d', label: 'Last 3 Days' },
    { value: '7d', label: 'Last Week' },
    { value: '14d', label: 'Last 2 Weeks' },
    { value: '30d', label: 'Last Month' }
  ],
  
  REPORT_TYPES: [
    { value: 'comprehensive', label: 'Comprehensive' },
    { value: 'sentiment', label: 'Sentiment Only' },
    { value: 'earnings', label: 'Earnings Focus' },
    { value: 'analyst', label: 'Analyst Reports' }
  ],
  
  SENTIMENT_THRESHOLDS: {
    POSITIVE: 0.2,
    NEGATIVE: -0.2
  },
  
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 50
};

// Cache management
export const cache = {
  store: new Map(),
  
  get: (key) => {
    const item = cache.store.get(key);
    if (!item) return null;
    
    const now = Date.now();
    if (now - item.timestamp > CONSTANTS.CACHE_DURATION) {
      cache.store.delete(key);
      return null;
    }
    
    return item.data;
  },
  
  set: (key, data) => {
    // Limit cache size
    if (cache.store.size >= CONSTANTS.MAX_CACHE_SIZE) {
      const firstKey = cache.store.keys().next().value;
      cache.store.delete(firstKey);
    }
    
    cache.store.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  clear: () => {
    cache.store.clear();
  }
};

export default {
  formatDate,
  getSentimentColor,
  getSentimentIcon,
  getCategoryColor,
  exportToCSV,
  getSentimentLabel,
  validateStockSymbol,
  debounce,
  calculatePercentageChange,
  formatNumber,
  getTimeGreeting,
  isMarketOpen,
  generateId,
  truncateText,
  parseApiError,
  storage,
  theme,
  rateLimiter,
  cache,
  CONSTANTS
};
