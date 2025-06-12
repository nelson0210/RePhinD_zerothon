import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, Calendar, User, Loader2, ArrowLeft, Brain } from 'lucide-react'
import { Patent } from '../types'

interface SummaryPageProps {
  patent: Patent
}

// 특허 상세 정보 테이블 컴포넌트
const PatentDetailTable = ({ patent }: { patent: Patent }) => {
  // 청구항 키에서 정보 추출
  const parseClaimData = (claimKeys: string) => {
    try {
      const data = JSON.parse(claimKeys)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  const claimData = parseClaimData(patent.claim_key || '[]')
  
  // 청구항1과 청구항 키에서 성분 정보 추출
  const parseComponents = (data: string[]) => {
    const componentMap: { [key: string]: string } = {}
    
    // 청구항1 텍스트에서도 직접 추출
    const claimText = patent.claim_text || ''
    
    // 모든 데이터 소스 결합 (청구항 키 + 청구항1 텍스트)
    const allSources = [...data, claimText]
    
    allSources.forEach(item => {
      const cleanItem = item.replace(/"/g, '').trim()
      
      // 다양한 패턴으로 원소 정보 추출
      const patterns = [
        // 한국어 패턴 (청구항 키)
        { key: 'C', regex: /탄소\(C\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Si', regex: /실리콘\(Si\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Mn', regex: /망간\(Mn\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'P', regex: /인\(P\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'S', regex: /황\(S\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Cr', regex: /크롬\(Cr\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Mo', regex: /몰리브덴\(Mo\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Ti', regex: /티타늄\(Ti\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Nb', regex: /니오븀\(Nb\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'V', regex: /바나듐\(V\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Cu', regex: /구리\(Cu\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Ni', regex: /니켈\(Ni\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'B', regex: /붕소\(B\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'N', regex: /질소\(N\):\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Al', regex: /알루미늄\(Al\):\s*([\d.~%\s\w이상하내지]+)/i },
        
        // 영문 패턴 (청구항1 텍스트)
        { key: 'C', regex: /C\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Si', regex: /Si\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Mn', regex: /Mn\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'P', regex: /P\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'S', regex: /S\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Cr', regex: /Cr\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Mo', regex: /Mo\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Ti', regex: /Ti\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Nb', regex: /Nb\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'V', regex: /V\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Cu', regex: /Cu\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Ni', regex: /Ni\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'B', regex: /B\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'N', regex: /N\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Al', regex: /Al\s*:\s*([\d.~%\s\w이상하내지]+)/i },
        
        // 추가 원소들
        { key: 'Sn', regex: /(?:주석|Sn)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Sb', regex: /(?:안티몬|Sb)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'As', regex: /(?:비소|As)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Ta', regex: /(?:탄탈륨|Ta)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Ca', regex: /(?:칼슘|Ca)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Mg', regex: /(?:마그네슘|Mg)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Zn', regex: /(?:아연|Zn)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'Co', regex: /(?:코발트|Co)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'W', regex: /(?:텅스텐|W)\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
        { key: 'REM', regex: /REM\s*[:\(]?\s*([\d.~%\s\w이상하내지]+)/i },
      ]
      
      patterns.forEach(({ key, regex }) => {
        const match = cleanItem.match(regex)
        if (match && !componentMap[key]) { // 이미 값이 있으면 덮어쓰지 않음
          let value = match[1].trim()
          // 불필요한 텍스트 제거
          value = value.replace(/를?\s*함유하고?/g, '').replace(/이하/g, ' 이하').replace(/이상/g, ' 이상').trim()
          componentMap[key] = value
        }
      })
    })
    
    return componentMap
  }

  const components = parseComponents(claimData)
  
  // 미세조직 정보 추출
  const parseMicrostructure = (data: string[]) => {
    const microstructures: { [key: string]: string } = {}
    const claimText = patent.claim_text || ''
    const allSources = [...data, claimText]
    
    allSources.forEach(item => {
      const cleanItem = item.replace(/"/g, '').trim()
      
      // 마르텐사이트 관련 정보
      if (cleanItem.includes('마르텐사이트') || cleanItem.includes('마텐자이트')) {
        if (!microstructures['martensite']) {
          microstructures['martensite'] = cleanItem
        }
      }
      
      // 베이나이트 관련 정보
      if (cleanItem.includes('베이나이트')) {
        if (!microstructures['bainite']) {
          microstructures['bainite'] = cleanItem
        }
      }
      
      // 오스테나이트 관련 정보
      if (cleanItem.includes('오스테나이트')) {
        if (!microstructures['austenite']) {
          microstructures['austenite'] = cleanItem
        }
      }
      
      // 페라이트 관련 정보
      if (cleanItem.includes('페라이트')) {
        if (!microstructures['ferrite']) {
          microstructures['ferrite'] = cleanItem
        }
      }
      
      // 펄라이트 관련 정보
      if (cleanItem.includes('펄라이트')) {
        if (!microstructures['pearlite']) {
          microstructures['pearlite'] = cleanItem
        }
      }
      
      // 세멘타이트 관련 정보
      if (cleanItem.includes('세멘타이트') || cleanItem.includes('시멘타이트')) {
        if (!microstructures['cementite']) {
          microstructures['cementite'] = cleanItem
        }
      }
    })
    
    // 모든 미세조직 정보를 하나의 문자열로 결합
    const allMicrostructures = Object.values(microstructures).join(', ')
    return allMicrostructures
  }

  const microstructureInfo = parseMicrostructure(claimData)

  // 첨부된 표와 정확히 일치하는 원소 목록
  const allElements = [
    'C', 'Si', 'Mn', 'P', 'S', 'Cr', 'Mo', 'Ti', 'Nb', 'V', 'Cu', 'Ni', 'B', 'N', 'Sb', 'Sn', 'As', 'Ta', 'Ca', 'Mg', 'Zn', 'Co', 'W', 'REM'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        특허 상세 정보 분석표
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-sm">
          <tbody>
            {/* 헤더 */}
            <tr className="bg-blue-50 dark:bg-blue-900/20">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                대분류
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                상세분류
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                검사 특허
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                비교 특허
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center bg-yellow-100 dark:bg-yellow-900/20">
                일치율(%)
              </td>
            </tr>
            
            {/* 기본 정보 */}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white">특허번호</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.patent_id}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600">{patent.similarity_score}%</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white">출원인</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.applicant}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white">발명자</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.applicant}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white">공개일자</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.application_year}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white">국가</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.country_code || 'KR'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>

            {/* 합금원소 섹션 */}
            <tr className="bg-gray-100 dark:bg-gray-700">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white text-center" rowSpan={allElements.length + 1}>
                합금원소
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                원소
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                검사 특허
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center">
                비교 특허
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-semibold text-gray-900 dark:text-white text-center bg-yellow-100 dark:bg-yellow-900/20">
                일치율(%)
              </td>
            </tr>

            {/* 모든 원소 행 */}
            {allElements.map((element) => (
              <tr key={element} className={element === 'C' || element === 'Si' || element === 'Mn' ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">
                  {element}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
                  {components[element] || '-'}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">
                  -
                </td>
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                  -
                </td>
              </tr>
            ))}

            {/* 성분(wt%) 합계 */}
            <tr className="bg-yellow-100 dark:bg-yellow-900/20">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white">
                성분(wt%)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white">
                (총합) 성분 일치율(%)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">
                -
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">
                -
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600">
                {Math.round(patent.similarity_score * 0.8)}%
              </td>
            </tr>

            {/* 미세조직 섹션 */}
            <tr className="bg-gray-100 dark:bg-gray-700">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white text-center" rowSpan={6}>
                미세조직
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
                마르텐사이트(M, F, B, RA등)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
                {microstructureInfo || '-'}
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">
                -
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">
                -
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">잠정밀도</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">이즈(베이나이트, 오스테나이트 등)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">석출물 파라미터</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">기타</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>

            {/* 미세조직 일치율 합계 */}
            <tr className="bg-yellow-100 dark:bg-yellow-900/20">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white">
                (총합) 미세조직 일치율(%)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">
                통독정도(VS)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">
                -
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600">
                {Math.round(patent.similarity_score * 0.9)}%
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">민정정도</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
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

        <PatentDetailTable patent={patent} />
      </div>
    </div>
  )
}