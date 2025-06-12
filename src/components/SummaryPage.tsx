import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, User, Loader2, ArrowLeft, Brain } from 'lucide-react'
import { Patent } from '../types'

interface SummaryPageProps {
  patent: Patent
}

export default function SummaryPage({ patent }: SummaryPageProps) {
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    generateSummary()
  }, [patent])

  const generateSummary = async () => {
    setIsLoading(true)
    setError('')
    setSummary('')

    try {
      const response = await fetch('/api/summarize-patent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patent_data: patent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data.summary)
      
    } catch (err) {
      setError('Failed to generate summary. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatSummary = (text: string) => {
    // Split by numbered sections and format
    const sections = text.split(/(?=\d+\.\s*\*\*)/g).filter(section => section.trim())
    
    return sections.map((section, index) => {
      // Extract title and content
      const titleMatch = section.match(/\*\*(.*?)\*\*/)
      const title = titleMatch ? titleMatch[1] : `Section ${index + 1}`
      const content = section.replace(/\d+\.\s*\*\*.*?\*\*:?\s*/, '').trim()
      
      return (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          className="mb-6"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center">
            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">
              {index + 1}
            </span>
            {title}
          </h3>
          <div className="pl-9">
            {content.split('\n').map((line, lineIndex) => {
              if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                return (
                  <p key={lineIndex} className="text-gray-700 dark:text-gray-300 mb-2 ml-4">
                    {line.trim()}
                  </p>
                )
              }
              return (
                <p key={lineIndex} className="text-gray-700 dark:text-gray-300 mb-2">
                  {line.trim()}
                </p>
              )
            })}
          </div>
        </motion.div>
      )
    })
  }

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => window.history.back()}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search</span>
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                  {patent.title}
                </h1>
                
                <div className="flex flex-wrap gap-8 text-xl font-medium">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    <span className="text-white">{patent.patent_id}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-6 h-6 text-purple-600" />
                    <span className="text-white">{patent.applicant}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    <span className="text-white">{patent.application_year}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-bold text-blue-600">
                  {patent.similarity_score}%
                </div>
                <div className="text-base text-gray-600 font-medium">similarity</div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Original Claim Text
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                {patent.claim_text}
              </p>
            </div>
          </div>
        </motion.div>

        {/* AI Summary Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI-Powered Patent Analysis
              </h2>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Generating comprehensive patent analysis...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={generateSummary}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {summary && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {formatSummary(summary)}
              </motion.div>
            )}

            {!summary && !isLoading && !error && (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  AI analysis will appear here
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={generateSummary}
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Regenerating...' : 'Regenerate Summary'}
          </button>
          
          <button className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            Export Analysis
          </button>
        </motion.div>
      </div>
    </div>
  )
}