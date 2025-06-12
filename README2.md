# 📋 RePhinD - AI-Powered Patent Analysis Platform

**Let RePhinD Read Patents. You Lead Innovation.**

A modern web application for patent similarity search and AI-powered patent summarization, designed to revolutionize patent analysis workflows.

![RePhinD Banner](https://img.shields.io/badge/RePhinD-Patent%20Analysis-blue?style=for-the-badge&logo=search&logoColor=white)

## 🎯 Overview

RePhinD is a comprehensive patent analysis platform that combines cutting-edge AI technology with intuitive user experience to provide:

- 🔍 **Intelligent Patent Search**: Upload PDF or input patent claims to find similar patents
- 📊 **Visual Analytics**: Interactive charts showing similarity scores and trends
- 🤖 **AI-Powered Summarization**: GPT-based patent summaries with structured analysis
- 📱 **Responsive Design**: Seamless experience across all devices
- 🌙 **Dark Mode Support**: Toggle between light and dark themes
- ✨ **Smooth Animations**: Framer Motion powered interactions

## 🏗️ Architecture

### Project Structure
```
RePhinD/
├── 🎨 Frontend (React/TypeScript)
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── LandingPage.tsx # Welcome page
│   │   │   ├── SearchPage.tsx  # Patent search interface
│   │   │   ├── SummaryPage.tsx # Patent analysis results
│   │   │   └── Navigation.tsx  # App navigation
│   │   ├── contexts/           # React Context providers
│   │   ├── types/             # TypeScript definitions
│   │   └── utils/             # Utility functions
│   ├── index.html
│   └── vite.config.js
│
├── 🔧 Backend (Python)
│   ├── main.py                # FastAPI main server
│   ├── simple_backend.py      # Lightweight HTTP server
│   └── run_backend.py         # Server execution script
│
├── 📊 Data
│   └── data/
│       └── patent_db_수정_csv_10개.csv  # Patent database
│
└── ⚙️ Configuration
    ├── package.json           # Node.js dependencies
    ├── pyproject.toml         # Python dependencies
    ├── tailwind.config.js     # Tailwind CSS config
    └── .replit               # Repl.it deployment config
```

## 🛠️ Tech Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.1.0 | UI Framework |
| **TypeScript** | 5.8.3 | Type Safety |
| **Tailwind CSS** | 4.1.10 | Styling |
| **Framer Motion** | 12.17.0 | Animations |
| **Vite** | 6.3.5 | Build Tool |
| **Chart.js** | 4.4.9 | Data Visualization |
| **Lucide React** | 0.514.0 | Icons |

### Backend Technologies
| Technology | Purpose |
|------------|---------|
| **FastAPI** | High-performance API framework |
| **SentenceTransformers** | Text embedding generation |
| **OpenAI GPT API** | AI-powered summarization |
| **PyMuPDF & pdfplumber** | PDF text extraction |
| **scikit-learn** | Cosine similarity calculation |
| **pandas & numpy** | Data processing |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- OpenAI API key (optional, for AI summaries)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RePhinD
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   # For FastAPI version (recommended)
   pip install fastapi uvicorn sentence-transformers openai PyMuPDF pdfplumber pandas numpy scikit-learn python-dotenv
   
   # Or install from pyproject.toml
   pip install -e .
   ```

4. **Set up environment variables**
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
   ```

### Running the Application

#### Option 1: Full AI-Powered Version (Recommended)
```bash
# Terminal 1: Start FastAPI backend
uvicorn main:app --reload --port 8000

# Terminal 2: Start frontend development server
npm run dev
```

#### Option 2: Lightweight Version
```bash
# Terminal 1: Start simple backend
python simple_backend.py

# Terminal 2: Start frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## 📖 User Guide

### 🔍 How to Search Patents

1. **Navigate to Search Page**
   - Click "Get Started" on the landing page
   - Or use the navigation menu

2. **Input Patent Information**
   - **Option A**: Upload a PDF patent document
   - **Option B**: Paste patent claim text directly

3. **View Results**
   - Browse similar patents ranked by similarity score
   - View interactive similarity charts
   - Click on any patent for detailed analysis

4. **Get AI Summary**
   - Select a patent from search results
   - View comprehensive AI-generated analysis including:
     - Technical field classification
     - Problem solved by the patent
     - Key innovations and advantages
     - Potential applications
     - Technical complexity assessment

### 🎨 Interface Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Toggle in the navigation bar
- **Smooth Animations**: Page transitions and loading states
- **Interactive Charts**: Hover and click for detailed information

## 🔧 API Documentation

### Endpoints

#### `GET /`
**Health Check**
```json
{
  "message": "RePhinD API is running"
}
```

#### `POST /upload-pdf`
**Upload PDF and Extract Claims**

**Request**: Multipart form data with PDF file

**Response**:
```json
{
  "claim_text": "A method for wireless communication comprising..."
}
```

#### `POST /search-similar-patents`
**Search Similar Patents**

**Request**:
```json
{
  "claim_text": "A method for wireless communication comprising..."
}
```

**Response**:
```json
{
  "similar_patents": [
    {
      "patent_id": "US001",
      "title": "Method for wireless communication using antenna arrays",
      "applicant": "TechCorp Inc.",
      "application_year": 2020,
      "similarity_score": 85.67,
      "claim_text": "A method for wireless communication comprising..."
    }
  ]
}
```

#### `POST /summarize-patent`
**Generate AI Patent Summary**

**Request**:
```json
{
  "patent_data": {
    "patent_id": "US001",
    "title": "Method for wireless communication",
    "applicant": "TechCorp Inc.",
    "application_year": 2020,
    "claim_text": "A method for wireless communication comprising..."
  }
}
```

**Response**:
```json
{
  "patent_id": "US001",
  "summary": "**1. Technical Field**: Advanced communication systems..."
}
```

## 🧠 AI Features

### Patent Similarity Algorithm
1. **Text Preprocessing**: Clean and normalize patent text
2. **Embedding Generation**: Use SentenceTransformers (all-MiniLM-L6-v2)
3. **Similarity Calculation**: Cosine similarity between embeddings
4. **Ranking**: Sort results by similarity score (0-100%)

### AI Summarization Structure
The AI provides structured analysis in 7 categories:

1. **Technical Field**: Technology domain classification
2. **Problem Solved**: Specific challenges addressed
3. **Key Innovation**: Main innovative aspects
4. **Technical Components**: Essential system elements
5. **Advantages**: Benefits and improvements
6. **Potential Applications**: Industry use cases
7. **Technical Complexity**: Complexity rating and explanation

## 🎯 Use Cases

### For Patent Attorneys
- **Prior Art Search**: Find existing patents before filing
- **Infringement Analysis**: Identify potentially infringing patents
- **Patent Landscape**: Understand competitive technology space

### For R&D Teams
- **Technology Scouting**: Discover emerging technologies
- **Innovation Gaps**: Identify unexplored areas
- **Competitive Intelligence**: Monitor competitor patents

### For IP Managers
- **Portfolio Analysis**: Evaluate patent portfolio strength
- **Licensing Opportunities**: Find patents for licensing
- **Strategic Planning**: Make informed IP decisions

## 🔒 Security & Privacy

### Data Security
- **File Validation**: Only PDF files accepted for upload
- **Input Sanitization**: All text inputs are validated
- **API Key Protection**: Environment variable storage
- **CORS Configuration**: Controlled cross-origin requests

### Privacy Considerations
- **No Data Storage**: Uploaded files are processed in memory only
- **API Rate Limiting**: Prevents abuse of external APIs
- **Error Handling**: Secure error messages without sensitive data

## 🚀 Deployment

### Development Environment
```bash
# Frontend development server
npm run dev

# Backend development server
uvicorn main:app --reload --port 8000
```

### Production Deployment

#### Frontend (Static Hosting)
```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting service
```

#### Backend (Cloud Deployment)
```bash
# Using Docker
docker build -t rephind-api .
docker run -p 8000:8000 rephind-api

# Using cloud services (AWS, GCP, Azure)
# Deploy using your preferred cloud platform
```

### Environment Variables
```bash
# Required for AI summaries
OPENAI_API_KEY=your_openai_api_key

# Optional: Custom model configurations
SENTENCE_TRANSFORMER_MODEL=all-MiniLM-L6-v2
MAX_SIMILARITY_RESULTS=10
```

## 🔧 Configuration

### Frontend Configuration
**vite.config.js**
```javascript
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
}
```

**tailwind.config.js**
```javascript
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Custom theme configurations
    }
  }
}
```

### Backend Configuration
**Environment Variables**
- `OPENAI_API_KEY`: OpenAI API key for GPT summaries
- `CORS_ORIGINS`: Allowed CORS origins (default: "*")
- `MAX_FILE_SIZE`: Maximum PDF file size (default: 10MB)

## 🧪 Testing

### Frontend Testing
```bash
# Run tests (when implemented)
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Backend Testing
```bash
# Run API tests
python -m pytest tests/

# Manual API testing
curl -X GET http://localhost:8000/
```

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Black + isort for Python formatting
- **Commits**: Conventional commit messages

## 📊 Performance

### Optimization Features
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Optimized assets and icons
- **API Caching**: Intelligent caching of similarity results
- **Bundle Splitting**: Optimized JavaScript bundles

### Performance Metrics
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **API Response Time**: < 2s for similarity search

## 🐛 Troubleshooting

### Common Issues

#### Frontend Issues
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

#### Backend Issues
```bash
# Install missing dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.11+

# Verify API key
echo $OPENAI_API_KEY
```

#### PDF Processing Issues
- Ensure PDF is not password protected
- Check file size (max 10MB)
- Verify PDF contains extractable text

## 📈 Roadmap

### Upcoming Features
- [ ] **Multi-language Support**: Support for patents in different languages
- [ ] **Advanced Filtering**: Filter by applicant, year, technology field
- [ ] **Batch Processing**: Analyze multiple patents simultaneously
- [ ] **Export Features**: Export results to PDF/Excel
- [ ] **User Accounts**: Save searches and create collections
- [ ] **API Integration**: Connect to official patent databases

### Technical Improvements
- [ ] **Enhanced AI Models**: Upgrade to more sophisticated language models
- [ ] **Real-time Processing**: WebSocket-based real-time updates
- [ ] **Database Integration**: Full-scale patent database integration
- [ ] **Mobile App**: Native mobile applications
- [ ] **Enterprise Features**: Advanced analytics and reporting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT API services
- **Hugging Face** for SentenceTransformers models
- **React Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Framer Motion** for smooth animations

## 📞 Support

### Getting Help
- **Documentation**: Check this README and inline code comments
- **Issues**: Open an issue on GitHub for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions and ideas

### Contact Information
- **Project Maintainer**: [Your Name]
- **Email**: [your.email@example.com]
- **GitHub**: [Your GitHub Profile]

---

**Made with ❤️ for the patent analysis community**

*RePhinD - Revolutionizing patent analysis through AI innovation* 