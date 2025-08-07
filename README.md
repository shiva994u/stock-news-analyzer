# Stock News Analyzer 📈

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Deploy](https://github.com/shiva994u/stock-news-analyzer/actions/workflows/deploy.yml/badge.svg)](https://github.com/shiva994u/stock-news-analyzer/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live-Demo-success.svg)](https://shiva994u.github.io/stock-news-analyzer)

A comprehensive React-based web application for **real-time stock news analysis and sentiment tracking**. Features AI-powered sentiment analysis, multiple API integrations, and professional data visualization.

## ✨ Features

### 🚀 **Real-time Stock Analysis**
- Search any stock symbol (AAPL, GOOGL, TSLA, etc.)
- Real-time news fetching from **4 different APIs**
- Automatic sentiment analysis with confidence scores
- Smart fallback system with demo data

### 🧠 **AI-Powered Insights**
- Advanced sentiment analysis using multiple algorithms
- Entity recognition with confidence scoring  
- News categorization (earnings, analyst reports, regulatory, etc.)
- Predictive sentiment distribution

### 📊 **Professional Dashboard**
- Interactive data visualization
- Export functionality (CSV reports)
- Responsive design for all devices
- Real-time API status monitoring

### 🔌 **Multiple Free APIs (300+ requests/day total!)**
- **🏆 Marketaux**: 100 req/day, premium sentiment analysis
- **⚡ Finnhub**: 60 req/minute, real-time data streaming  
- **🎯 Stock News API**: 100 req/day, US market specialist
- **📊 Alpha Vantage**: 25 req/day, NASDAQ official partner

## 🎯 Live Demo

**👉 [Try it now!](https://shiva994u.github.io/stock-news-analyzer)**

Works immediately with demo data. Configure API keys for real-time news!

## 🚀 Quick Start (2 minutes!)

### 1. Clone and Install
```bash
git clone https://github.com/shiva994u/stock-news-analyzer.git
cd stock-news-analyzer
npm install
npm start
```

### 2. Configure APIs (Optional but Recommended)
```bash
# Copy environment template
cp .env.example .env

# Add your free API keys to .env file
REACT_APP_MARKETAUX_API_KEY=your_key_here
REACT_APP_FINNHUB_API_KEY=your_key_here
```

### 3. Get Free API Keys (5 minutes)

#### 🏆 **Marketaux** (Recommended - Best sentiment analysis)
- **Free Tier**: 100 requests/day
- **Features**: Built-in sentiment analysis, 5000+ sources, entity recognition
- **Sign up**: [marketaux.com](https://www.marketaux.com) → Get API Key

#### ⚡ **Finnhub** (Best for real-time data)
- **Free Tier**: 60 requests/minute (!)
- **Features**: Real-time prices, WebSocket streaming, global coverage
- **Sign up**: [finnhub.io/register](https://finnhub.io/register) → Get API Key

#### 🎯 **Stock News API** (US markets specialist)
- **Free Tier**: 100 requests/day  
- **Features**: US focus, historical data back to 2019, topic filtering
- **Sign up**: [stocknewsapi.com/register](https://stocknewsapi.com/register) → Get API Key

#### 📊 **Alpha Vantage** (NASDAQ official partner)
- **Free Tier**: 25 requests/day
- **Features**: Technical indicators, economic data, sentiment scores
- **Sign up**: [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) → Get API Key

## 📱 Screenshots

| Dashboard | Sentiment Analysis | News Table |
|-----------|-------------------|------------|
| ![Dashboard](https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Dashboard) | ![Sentiment](https://via.placeholder.com/300x200/10B981/FFFFFF?text=Sentiment) | ![News](https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=News+Table) |

## 💻 Usage Examples

### Basic Usage
```javascript
// The app works immediately with demo data
// Just search for any stock symbol: AAPL, GOOGL, TSLA, etc.
```

### With Real APIs
```javascript
// Configure .env file with your API keys
REACT_APP_MARKETAUX_API_KEY=your_key_here
REACT_APP_FINNHUB_API_KEY=your_key_here

// App automatically uses real data when keys are configured
```

### Export Data
```javascript
// Click "Export CSV" button to download analysis
// Includes: sentiment scores, sources, timestamps, categories
```

## 📊 API Comparison

| API | Free Limit | Best For | Sentiment | Real-time |
|-----|------------|----------|-----------|-----------|
| **Marketaux** | 100/day | Sentiment analysis | ✅ Built-in | ❌ |
| **Finnhub** | 60/minute | Real-time data | ❌ | ✅ |  
| **Stock News API** | 100/day | US markets | ✅ Built-in | ❌ |
| **Alpha Vantage** | 25/day | Technical data | ✅ Scores | ❌ |
| **Total** | **300+/day** | **All features** | **✅** | **✅** |

## 🛠️ Development

### Available Scripts
```bash
npm start          # Start development server (http://localhost:3000)
npm run build      # Build for production
npm test           # Run test suite  
npm run lint       # Code linting
npm run deploy     # Deploy to GitHub Pages
```

### Project Structure
```
src/
├── App.js                 # Main application component
├── services/
│   └── newsApi.js         # Enhanced news service with 4 APIs
├── utils/
│   └── helpers.js         # Utility functions
├── index.js              # Entry point
└── index.css             # Global styles
```

## 🚀 Deployment Options

### GitHub Pages (Recommended)
```bash
# Automatic deployment via GitHub Actions
git push origin main
# Live at: https://yourusername.github.io/stock-news-analyzer
```

### Netlify
```bash
npm run build
# Upload build/ folder to Netlify
# Or connect GitHub repository for auto-deploy
```

### Vercel  
```bash
npm run build
npx vercel --prod
# Automatic deployment from GitHub
```

### Local Production Build
```bash
npm run build
npx serve -s build
```

## ⚙️ Configuration

### Environment Variables
```bash
# Required for real data (optional - app works without them)
REACT_APP_MARKETAUX_API_KEY=your_key_here
REACT_APP_FINNHUB_API_KEY=your_key_here  
REACT_APP_STOCKNEWS_API_KEY=your_key_here
REACT_APP_ALPHAVANTAGE_API_KEY=your_key_here

# Optional settings
REACT_APP_DEFAULT_SYMBOL=AAPL
REACT_APP_MAX_ARTICLES=50
REACT_APP_DEBUG_MODE=false
```

### GitHub Secrets (for deployment)
1. Go to Settings > Secrets and variables > Actions
2. Add these secrets:
   - `REACT_APP_MARKETAUX_API_KEY`
   - `REACT_APP_FINNHUB_API_KEY`  
   - `REACT_APP_STOCKNEWS_API_KEY`
   - `REACT_APP_ALPHAVANTAGE_API_KEY`

## 🔧 Troubleshooting

### Common Issues

**❓ No real data showing?**
```bash
# Check if API keys are configured in .env file
# App shows demo data when no APIs are configured
# This is normal and expected behavior
```

**❓ CORS errors in development?**
```bash
# Some APIs may have CORS restrictions
# Deploy to production (GitHub Pages/Netlify) to resolve
# Or use a CORS proxy service
```

**❓ API rate limits reached?**
```bash
# App automatically rotates between multiple APIs  
# With 4 APIs, you get 300+ requests per day total
# Rate limits reset daily/hourly depending on API
```

**❓ Build errors?**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json  
npm install
npm start
```

## 🎯 Features Roadmap

### ✅ Phase 1 (Current)
- [x] Multi-API news aggregation (4 APIs)
- [x] Real-time sentiment analysis
- [x] CSV export functionality
- [x] Responsive design
- [x] GitHub Actions deployment
- [x] Demo data fallback

### 🚧 Phase 2 (In Progress)  
- [ ] WebSocket real-time streaming
- [ ] Advanced charting with Chart.js
- [ ] User watchlists
- [ ] Email/SMS alerts
- [ ] Dark mode theme

### 🔮 Phase 3 (Planned)
- [ ] Machine learning predictions
- [ ] Social media sentiment (Twitter/Reddit)
- [ ] Options data integration
- [ ] Mobile app (React Native)
- [ ] Backend API with database

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Quick Contribute
1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/stock-news-analyzer.git`
3. **Create** a branch: `git checkout -b feature-name`
4. **Make** your changes
5. **Test** your changes: `npm test`
6. **Commit**: `git commit -m 'Add amazing feature'`
7. **Push**: `git push origin feature-name`  
8. **Submit** a Pull Request

### Development Setup
```bash
git clone https://github.com/shiva994u/stock-news-analyzer.git
cd stock-news-analyzer
npm install
cp .env.example .env
# Add your API keys to .env
npm start
```

### Code Style
- Use ESLint and Prettier (configured)
- Follow React best practices
- Write meaningful commit messages  
- Add tests for new features
- Update documentation

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **API Providers**: Marketaux, Finnhub, Stock News API, Alpha Vantage for generous free tiers
- **React Team**: For the amazing framework
- **Open Source Community**: For inspiration and contributions
- **Financial Data Providers**: For democratizing access to market data

## 📞 Support & Contact

- **🐛 Issues**: [GitHub Issues](https://github.com/shiva994u/stock-news-analyzer/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/shiva994u/stock-news-analyzer/discussions)
- **📧 Email**: Create an issue for support requests
- **⭐ Star**: [Star this repo](https://github.com/shiva994u/stock-news-analyzer) if it helped you!

## 📈 Stats & Analytics

![GitHub stars](https://img.shields.io/github/stars/shiva994u/stock-news-analyzer?style=social)
![GitHub forks](https://img.shields.io/github/forks/shiva994u/stock-news-analyzer?style=social)
![GitHub issues](https://img.shields.io/github/issues/shiva994u/stock-news-analyzer)
![GitHub last commit](https://img.shields.io/github/last-commit/shiva994u/stock-news-analyzer)

## 🔗 Links

- **🌐 Live Demo**: [https://shiva994u.github.io/stock-news-analyzer](https://shiva994u.github.io/stock-news-analyzer)
- **📚 Documentation**: This README
- **🎥 Video Tutorial**: Coming soon
- **📝 Blog Post**: Coming soon

---

**Built with ❤️ by [shiva994u](https://github.com/shiva994u)**

*⭐ Star this repository if you found it helpful!*

---

## 🚀 Quick Start Summary

1. **Clone**: `git clone https://github.com/shiva994u/stock-news-analyzer.git`
2. **Install**: `cd stock-news-analyzer && npm install`  
3. **Run**: `npm start`
4. **Use**: Search any stock (AAPL, GOOGL, TSLA)
5. **Configure APIs**: Add keys to `.env` for real data
6. **Deploy**: Push to main branch for auto-deployment

**🎯 Works immediately with demo data - no configuration required!**
