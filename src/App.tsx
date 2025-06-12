import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LandingPage from './components/LandingPage'
import SearchPage from './components/SearchPage'
import SummaryPage from './components/SummaryPage'
import Navigation from './components/Navigation'
import { ThemeProvider } from './contexts/ThemeContext'
import { Patent } from './types'

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'search' | 'summary'>('landing')
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null)
  const [searchClaimText, setSearchClaimText] = useState<string>('')

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 transition-all duration-500">
        <Navigation currentPage={currentPage} setCurrentPage={setCurrentPage} />
        
        <AnimatePresence mode="wait">
          {currentPage === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <LandingPage onGetStarted={() => setCurrentPage('search')} />
            </motion.div>
          )}
          
          {currentPage === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5 }}
            >
              <SearchPage 
                onPatentSelect={(patent, claimText) => {
                  setSelectedPatent(patent)
                  setSearchClaimText(claimText)
                  setCurrentPage('summary')
                }}
              />
            </motion.div>
          )}
          
          {currentPage === 'summary' && selectedPatent && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.5 }}
            >
              <SummaryPage patent={selectedPatent} searchClaimText={searchClaimText} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}

export default App