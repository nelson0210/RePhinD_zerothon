import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, Search, FileText, Home } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

interface NavigationProps {
  currentPage: 'landing' | 'search' | 'summary'
  setCurrentPage: (page: 'landing' | 'search' | 'summary') => void
}

export default function Navigation({ currentPage, setCurrentPage }: NavigationProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setCurrentPage('landing')}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">R</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RePhinD
            </span>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <NavItem
              icon={Home}
              label="Home"
              isActive={currentPage === 'landing'}
              onClick={() => setCurrentPage('landing')}
            />
            <NavItem
              icon={Search}
              label="Search"
              isActive={currentPage === 'search'}
              onClick={() => setCurrentPage('search')}
            />
            <NavItem
              icon={FileText}
              label="Summary"
              isActive={currentPage === 'summary'}
              onClick={() => setCurrentPage('summary')}
            />
          </div>

          {/* Theme Toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.nav>
  )
}

interface NavItemProps {
  icon: React.ComponentType<any>
  label: string
  isActive: boolean
  onClick: () => void
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{label}</span>
    </motion.button>
  )
}