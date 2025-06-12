import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Search, Loader2, BarChart3, Eye } from 'lucide-react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface Patent {
  patent_id: string
  title: string
  applicant: string
  application_year: number
  similarity_score: number
  claim_text: string
}

interface SearchPageProps {
  onPatentSelect: (patent: Patent) => void
}

export default function SearchPage({ onPatentSelect }: SearchPageProps) {
  const [inputMethod, setInputMethod] = useState<'pdf' | 'text'>('text')
  const [claimText, setClaimText] = useState('')
  const [searchResults, setSearchResults] = useState<Patent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.pdf')) {
      setError('Please select a PDF file')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to upload PDF')
      }

      const data = await response.json()
      setClaimText(data.claim_text)
      setInputMethod('text')
      
    } catch (err) {
      setError('Failed to extract text from PDF. Please check your file.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!claimText.trim()) {
      setError('Please enter claim text or upload a PDF')
      return
    }

    setIsLoading(true)
    setError('')
    setSearchResults([])

    try {
      const response = await fetch('/api/search-similar-patents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          claim_text: claimText,
        }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.similar_patents)
      
    } catch (err) {
      setError('Search failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = {
    labels: searchResults.map(patent => patent.patent_id),
    datasets: [
      {
        label: 'Similarity Score (%)',
        data: searchResults.map(patent => patent.similarity_score),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Patent Similarity Scores',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Patent Similarity Search
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload a patent PDF or enter claim text to find similar patents
          </p>
        </motion.div>

        {/* Input Method Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button
              onClick={() => setInputMethod('text')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                inputMethod === 'text'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Enter Claim Text</p>
            </button>
            
            <button
              onClick={() => setInputMethod('pdf')}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                inputMethod === 'pdf'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <Upload className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="font-medium">Upload PDF</p>
            </button>
          </div>

          {inputMethod === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Patent Claim Text
              </label>
              <textarea
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                placeholder="Enter the patent claim text here..."
                className="w-full h-40 p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center cursor-pointer hover:border-blue-500 transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload PDF
                </p>
                <p className="text-sm text-gray-500">
                  Supported format: PDF
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            disabled={isLoading || !claimText.trim()}
            className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Search Similar Patents</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center space-x-2 mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Similarity Analysis
                </h2>
              </div>
              <div className="h-64">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid gap-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Similar Patents ({searchResults.length})
              </h2>
              
              {searchResults.map((patent, index) => (
                <motion.div
                  key={patent.patent_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {patent.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>ID: {patent.patent_id}</span>
                        <span>Applicant: {patent.applicant}</span>
                        <span>Year: {patent.application_year}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {patent.similarity_score}%
                      </div>
                      <div className="text-sm text-gray-500">similarity</div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {patent.claim_text.length > 200 
                        ? `${patent.claim_text.substring(0, 200)}...` 
                        : patent.claim_text}
                    </p>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onPatentSelect(patent)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Summary</span>
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}