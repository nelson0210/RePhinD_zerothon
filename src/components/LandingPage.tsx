import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Zap, Shield, TrendingUp, Brain, Search, FileText } from 'lucide-react'

interface LandingPageProps {
  onGetStarted: () => void
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="pt-16 min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  RePhinD
                </span>
              </h1>
              <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mt-4 max-w-3xl mx-auto">
                Let RePhinD Read Patents. You Lead Innovation.
              </p>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-10"
            >
              Discover similar patents instantly with AI-powered semantic search and get comprehensive patent summaries with GPT technology.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
              >
                Watch Demo
              </motion.button>
            </motion.div>
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl"
            />
            <motion.div
              animate={{
                y: [0, 30, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
              className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 blur-xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Patent Intelligence
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Advanced AI technology meets patent research to deliver unprecedented insights
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Search}
              title="Semantic Search"
              description="Upload PDF or input claim text to find similar patents using advanced sentence transformers"
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon={Brain}
              title="AI Summarization"
              description="Get comprehensive patent summaries powered by GPT with structured analysis templates"
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Visual Analytics"
              description="Interactive charts and heatmaps showing similarity scores and patent relationships"
              gradient="from-green-500 to-emerald-500"
            />
            <FeatureCard
              icon={Zap}
              title="Lightning Fast"
              description="Instant results with pre-computed embeddings and optimized vector similarity search"
              gradient="from-yellow-500 to-orange-500"
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="Your patent data stays secure with enterprise-grade security and privacy protection"
              gradient="from-red-500 to-pink-500"
            />
            <FeatureCard
              icon={FileText}
              title="Rich Insights"
              description="Detailed patent analysis including technical complexity, applications, and innovation aspects"
              gradient="from-indigo-500 to-purple-500"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Ready to Transform Your Patent Research?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Join thousands of innovators who trust RePhinD for their patent intelligence needs
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onGetStarted}
              className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Start Your Free Search
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

interface FeatureCardProps {
  icon: React.ComponentType<any>
  title: string
  description: string
  gradient: string
}

function FeatureCard({ icon: Icon, title, description, gradient }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700"
    >
      <div className={`w-12 h-12 bg-gradient-to-r ${gradient} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  )
}