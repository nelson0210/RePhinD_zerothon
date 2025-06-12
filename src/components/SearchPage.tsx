
import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Search, Loader2, BarChart3, Eye, Sparkles } from 'lucide-react'
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
import { Patent } from '../types'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface SearchPageProps {
  onPatentSelect: (patent: Patent, claimText: string) => void
}

export default function SearchPage({ onPatentSelect }: SearchPageProps) {
  const [inputMethod, setInputMethod] = useState<'pdf' | 'text'>('text')
  const [claimText, setClaimText] = useState('')
  const [searchResults, setSearchResults] = useState<Patent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [typedText, setTypedText] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const placeholderText = "특허 청구항 텍스트를 입력하세요. 예: '무선 통신을 위한 방법으로서, 신호 전송을 위한 안테나 요소들을 제공하고 원격 장치와의 통신 링크를 설정하는 단계를 포함하는...'"

  // 타이핑 애니메이션 효과
  useEffect(() => {
    if (inputMethod === 'text' && !claimText) {
      let i = 0
      const timer = setInterval(() => {
        if (i < placeholderText.length) {
          setTypedText(placeholderText.slice(0, i + 1))
          i++
        } else {
          clearInterval(timer)
        }
      }, 50)
      return () => clearInterval(timer)
    }
  }, [inputMethod, claimText])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.pdf')) {
      setError('PDF 파일을 선택해주세요')
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
        throw new Error('PDF 업로드 실패')
      }

      const data = await response.json()
      setClaimText(data.claim_text)
      setInputMethod('text')
      
    } catch (err) {
      setError('PDF에서 텍스트 추출에 실패했습니다. 파일을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!claimText.trim()) {
      setError('청구항 텍스트를 입력하거나 PDF를 업로드해주세요')
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
        throw new Error('검색 실패')
      }

      const data = await response.json()
      setSearchResults(data.similar_patents)
      
    } catch (err) {
      setError('검색에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const chartData = {
    labels: searchResults.map(patent => patent.patent_id),
    datasets: [
      {
        label: '유사도 점수 (%)',
        data: searchResults.map(patent => patent.similarity_score),
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            size: 14,
            weight: 'bold' as const
          }
        }
      },
      title: {
        display: true,
        text: '특허 유사도 분석',
        font: {
          size: 18,
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          font: {
            size: 12
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          }
        }
      }
    },
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <motion.div 
            className="flex items-center justify-center mb-8"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="mr-4"
            >
              🔍
            </motion.div>
            <h1 className="text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              특허 유사도 검색
            </h1>
            <motion.div
              animate={{ y: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="ml-4"
            >
              ✨
            </motion.div>
          </motion.div>
          <motion.p 
            className="text-2xl lg:text-3xl text-gray-700 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            🤖 AI 기반 특허 분석으로 유사한 특허를 빠르게 찾아보세요
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl lg:text-2xl text-indigo-600 dark:text-indigo-400 font-medium"
          >
            📄 PDF 업로드 또는 📝 청구항 텍스트 입력으로 시작하세요
          </motion.div>
        </motion.div>

        {/* 향상된 입력 섹션 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-3xl p-10 shadow-2xl mb-12 border border-white/20"
        >
          {/* 입력 방법 선택 */}
          <div className="flex flex-col md:flex-row gap-6 mb-10">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInputMethod('text')}
              className={`flex-1 p-10 rounded-3xl border-3 transition-all duration-300 ${
                inputMethod === 'text'
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-2xl'
                  : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg'
              }`}
            >
              <motion.div
                animate={{ bounce: inputMethod === 'text' ? [0, -10, 0] : 0 }}
                transition={{ duration: 0.6, repeat: inputMethod === 'text' ? Infinity : 0, repeatDelay: 2 }}
                className="text-6xl mb-4"
              >
                📝
              </motion.div>
              <p className="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">청구항 텍스트 입력</p>
              <p className="text-lg text-gray-600 dark:text-gray-400">직접 텍스트를 입력하여 검색</p>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInputMethod('pdf')}
              className={`flex-1 p-10 rounded-3xl border-3 transition-all duration-300 ${
                inputMethod === 'pdf'
                  ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 shadow-2xl'
                  : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-lg'
              }`}
            >
              <motion.div
                animate={{ bounce: inputMethod === 'pdf' ? [0, -10, 0] : 0 }}
                transition={{ duration: 0.6, repeat: inputMethod === 'pdf' ? Infinity : 0, repeatDelay: 2 }}
                className="text-6xl mb-4"
              >
                📄
              </motion.div>
              <p className="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">PDF 업로드</p>
              <p className="text-lg text-gray-600 dark:text-gray-400">PDF 파일에서 자동 추출</p>
            </motion.button>
          </div>

          {inputMethod === 'text' ? (
            <div>
              <label className="block text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center">
                <span className="text-3xl mr-3">📋</span>
                특허 청구항 텍스트
              </label>
              <div className="relative">
                <textarea
                  value={claimText}
                  onChange={(e) => setClaimText(e.target.value)}
                  placeholder=""
                  className="w-full h-56 p-6 border-2 border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg leading-relaxed resize-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 shadow-inner"
                  style={{ caretColor: 'transparent' }}
                />
                {!claimText && (
                  <div className="absolute top-6 left-6 text-gray-500 dark:text-gray-400 text-lg leading-relaxed pointer-events-none">
                    {typedText}
                    <span className="animate-pulse">|</span>
                  </div>
                )}
              </div>
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
              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-indigo-300 dark:border-indigo-600 rounded-3xl p-20 text-center cursor-pointer hover:border-indigo-500 transition-all duration-300 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-900/20 dark:to-blue-900/20"
              >
                <motion.div
                  animate={{ y: [-10, 10, -10] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-8xl mb-8"
                >
                  📤
                </motion.div>
                <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                  📄 PDF 파일을 클릭하여 업로드
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-400">
                  ✅ 지원 형식: PDF (최대 10MB)
                </p>
              </motion.div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl p-6 mt-6"
            >
              <p className="text-red-700 dark:text-red-400 text-lg font-medium">{error}</p>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            disabled={isLoading || !claimText.trim()}
            className="w-full mt-10 px-10 py-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white rounded-3xl font-bold text-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-3xl transition-all duration-300 flex items-center justify-center space-x-4"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="text-3xl"
                >
                  ⏳
                </motion.div>
                <span>검색 중...</span>
              </>
            ) : (
              <>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-3xl"
                >
                  🔍
                </motion.span>
                <span>유사 특허 검색하기</span>
              </>
            )}
          </motion.button>
        </motion.div>

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-3xl p-8 shadow-2xl"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-white text-xl"
                  >
                    📊
                  </motion.div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Similarity Analysis</h2>
                  <p className="text-gray-400">Top 10 matching patents</p>
                </div>
              </div>
              <div className="bg-gray-700 px-4 py-2 rounded-lg">
                <span className="text-gray-300 font-medium">{searchResults.length} Results</span>
              </div>
            </div>

            {/* 결과 목록 */}
            <div className="space-y-4">
              {searchResults.map((patent, index) => {
                const BarProgress = ({ percentage }: { percentage: number }) => {
                  return (
                    <div className="flex-1 h-3 bg-gray-600 rounded-full overflow-hidden mx-6">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ 
                          duration: 1.5, 
                          delay: index * 0.1, 
                          ease: "easeOut" 
                        }}
                      />
                    </div>
                  )
                }

                return (
                  <motion.div
                    key={patent.patent_id}
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ 
                      scale: 1.02, 
                      backgroundColor: "rgba(75, 85, 99, 0.8)",
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => onPatentSelect(patent, claimText)}
                    className="bg-gray-700/50 hover:bg-gray-600/50 rounded-xl p-4 cursor-pointer transition-all duration-300 border border-gray-600/50 hover:border-gray-500"
                  >
                    <div className="flex items-center">
                      {/* 순위 */}
                      <div className="w-12 flex-shrink-0">
                        <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                      </div>

                      {/* 아이콘과 특허 정보 */}
                      <div className="flex items-center space-x-3 min-w-0 flex-shrink-0" style={{ width: '320px' }}>
                        <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs">⚡</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-bold text-sm truncate">
                            {patent.patent_id}
                          </div>
                          <div className="text-gray-400 text-xs truncate">
                            {patent.title.length > 30 ? `${patent.title.substring(0, 30)}...` : patent.title}
                          </div>
                        </div>
                      </div>

                      {/* 제품군 */}
                      <div className="w-20 flex-shrink-0 text-center">
                        <span className="text-blue-400 font-medium text-sm px-2 py-1 bg-blue-900/30 rounded-md">
                          {patent.product_group || 'N/A'}
                        </span>
                      </div>

                      {/* 진행률 바 */}
                      <BarProgress percentage={patent.similarity_score} />

                      {/* 퍼센트 */}
                      <div className="w-16 flex-shrink-0 text-right">
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 1.2 }}
                          className="text-red-400 font-bold text-sm"
                        >
                          {patent.similarity_score.toFixed(1)}%
                        </motion.span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
