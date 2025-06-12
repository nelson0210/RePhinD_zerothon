# RePhinD

**Let RePhinD Read Patents. You Lead Innovation.**

A modern web application for patent similarity search and AI-powered patent summarization.

## Features

- 🔍 **Patent Similarity Search**: Upload PDF or input patent claims to find similar patents
- 📊 **Visual Analytics**: Interactive charts showing similarity scores
- 🤖 **AI Summarization**: GPT-powered patent summaries with structured templates
- 📱 **Mobile Responsive**: Works seamlessly on all devices
- 🌙 **Dark Mode**: Toggle between light and dark themes
- ✨ **Smooth Animations**: Framer Motion powered interactions

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python
- **AI/ML**: SentenceTransformers, OpenAI GPT
- **Visualization**: Chart.js, React Charts

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Start the development servers:
   ```bash
   # Frontend
   npm start
   
   # Backend
   uvicorn main:app --reload --port 8000
   ```

## Project Structure

```
RePhinD/
├── frontend/          # React application
├── backend/           # FastAPI server
├── data/             # Patent CSV datasets
└── models/           # ML models and embeddings
```
