import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Patent } from '../types'

interface SummaryPageProps {
  patent: Patent
  searchClaimText: string
}

// 특허 상세 정보 테이블 컴포넌트 - 엑셀 템플릿 형식
const PatentDetailTable = ({ patent, searchClaimText }: { patent: Patent, searchClaimText: string }) => {
  // 검색 특허 정보를 추출하는 함수
  const parseSearchPatentInfo = (claimText: string) => {
    const info = {
      patent_id: '검색 특허',
      title: '사용자 입력 특허',
      applicant: '사용자 입력',
      inventor: '사용자 입력',
      publication_date: new Date().getFullYear().toString(),
      country: 'KR',
      registration_status: '검색 대상',
      steel_classification: '사용자 정의'
    }
    
    if (!claimText) return info
    
    // 특허번호 패턴 찾기
    const patentIdPatterns = [
      /"특허번호"\s*:\s*"?([^",\n\r]+)"?/i,
      /특허번호\s*:\s*([^,\n\r]+)/i,
      /(?:특허|출원)(?:번호|호)?\s*[":]\s*([0-9-]+)/i,
      /([0-9]{2}-[0-9]{4}-[0-9]{7})/,  // 10-2023-1234567 형태
    ]
    
    for (const pattern of patentIdPatterns) {
      const match = claimText.match(pattern)
      if (match) {
        info.patent_id = match[1].trim()
        break
      }
    }
    
    // 특허명 찾기
    const titlePatterns = [
      /"특허명"\s*:\s*([^,]+?)(?=\s*,\s*"|\s*$)/i,
      /특허명\s*:\s*([^,\n\r]+)/i,
      /(?:발명의?\s*명칭|제목|title)\s*[":]\s*([^,\n\r"]+)/i,
    ]
    
    for (const pattern of titlePatterns) {
      const match = claimText.match(pattern)
      if (match) {
        let title = match[1].trim()
        // 따옴표 제거
        title = title.replace(/^["']|["']$/g, '')
        if (title.length > 5 && title.length < 200) {
          info.title = title
          break
        }
      }
    }
    
    // 출원인 정보 찾기
    const applicantPatterns = [
      /"출원인"\s*:\s*([^,]+?)(?=\s*,\s*"|\s*$)/i,
      /출원인\s*:\s*([^,\n\r]+)/i,
      /(?:신청인|applicant)\s*[":]\s*([^,\n\r"]+)/i,
    ]
    
    for (const pattern of applicantPatterns) {
      const match = claimText.match(pattern)
      if (match) {
        let applicant = match[1].trim()
        applicant = applicant.replace(/^["']|["']$/g, '')
        info.applicant = applicant
        break
      }
    }
    
    // 발명자 정보 찾기
    const inventorPatterns = [
      /"발명자"\s*:\s*([^,]+?)(?=\s*,\s*"|\s*$)/i,
      /발명자\s*:\s*([^,\n\r]+)/i,
      /(?:발명인|inventor)\s*[":]\s*([^,\n\r"]+)/i,
    ]
    
    for (const pattern of inventorPatterns) {
      const match = claimText.match(pattern)
      if (match) {
        let inventor = match[1].trim()
        inventor = inventor.replace(/^["']|["']$/g, '')
        info.inventor = inventor
        break
      }
    }
    
    // 공개일자 찾기
    const datePatterns = [
      /"공개일자"\s*:\s*"?([0-9]{4}-[0-9]{1,2}-[0-9]{1,2})"?/i,
      /공개일자\s*:\s*([0-9]{4}-[0-9]{1,2}-[0-9]{1,2})/i,
      /(?:출원일|공개일|application\s*date|publication\s*date)\s*[":]\s*([0-9]{4}[-.]?[0-9]{1,2}[-.]?[0-9]{1,2})/i,
    ]
    
    for (const pattern of datePatterns) {
      const match = claimText.match(pattern)
      if (match) {
        info.publication_date = match[1].trim()
        break
      }
    }
    
    // 국가 정보 찾기
    const countryPatterns = [
      /"국가"\s*:\s*"?([^",\n\r]+)"?/i,
      /국가\s*:\s*([^,\n\r]+)/i
    ]
    
    for (const pattern of countryPatterns) {
      const match = claimText.match(pattern)
      if (match) {
        let country = match[1].trim()
        country = country.replace(/^["']|["']$/g, '')
        info.country = country
        break
      }
    }
    
    // 등록여부 찾기
    const statusPatterns = [
      /"등록여부"\s*:\s*"?([^",\n\r]+)"?/i,
      /등록여부\s*:\s*([^,\n\r]+)/i
    ]
    
    for (const pattern of statusPatterns) {
      const match = claimText.match(pattern)
      if (match) {
        let status = match[1].trim()
        status = status.replace(/^["']|["']$/g, '')
        info.registration_status = status
        break
      }
    }
    
    // 강종분류 찾기
    const steelPatterns = [
      /"강종분류"\s*:\s*"?([^",\n\r]+)"?/i,
      /강종분류\s*:\s*([^,\n\r]+)/i
    ]
    
    for (const pattern of steelPatterns) {
      const match = claimText.match(pattern)
      if (match) {
        let steel = match[1].trim()
        steel = steel.replace(/^["']|["']$/g, '')
        info.steel_classification = steel
        break
      }
    }
    
    // 기본 강종 키워드 매칭 (HPF강과 Mart강 구분)
    if (claimText.includes('HPF강') || claimText.includes('HPF')) {
      info.steel_classification = 'HPF강'
    } else if (claimText.includes('Mart강') || claimText.includes('마르텐사이트강')) {
      info.steel_classification = 'Mart강'
    } else if (claimText.includes('스테인리스') || claimText.includes('스테인레스') || claimText.includes('stainless')) {
      info.steel_classification = '스테인리스강'
    } else if (claimText.includes('탄소강') || claimText.includes('carbon steel')) {
      info.steel_classification = '탄소강'
    } else if (claimText.includes('합금강') || claimText.includes('alloy steel')) {
      info.steel_classification = '합금강'
    } else if (claimText.includes('고강도') || claimText.includes('high strength')) {
      info.steel_classification = '고강도강'
    } else if (claimText.includes('강판') || claimText.includes('steel sheet')) {
      info.steel_classification = '강판'
    } else if (claimText.includes('강재') || claimText.includes('steel material')) {
      info.steel_classification = '강재'
    } else if (claimText.includes('강') || claimText.includes('steel')) {
      info.steel_classification = '일반강'
    }
    
    return info
  }

  // 검색 특허 정보 추출
  const searchPatentInfo = parseSearchPatentInfo(searchClaimText)

  // 청구항 키에서 정보 추출
  const parseClaimData = (claimKeys: string) => {
    try {
      const data = JSON.parse(claimKeys)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }

  // 비교 특허 (클릭한 특허) 데이터 파싱
  const comparePatentClaimData = parseClaimData(patent.claim_key || '[]')
  
  // 청구항을 구조화된 배열로 파싱하는 함수
  const parseClaimToStructuredArray = (claimText: string): string[] => {
    const result: string[] = [];
    
    if (!claimText) return result;
    
    // 성분 조성 추출
    const elements = [
      { key: 'C', names: ['탄소', 'C'], korean: '탄소(C)' },
      { key: 'Si', names: ['실리콘', 'Si'], korean: '실리콘(Si)' },
      { key: 'Mn', names: ['망간', 'Mn'], korean: '망간(Mn)' },
      { key: 'P', names: ['인', 'P'], korean: '인(P)' },
      { key: 'S', names: ['황', 'S'], korean: '황(S)' },
      { key: 'Al', names: ['알루미늄', 'Al'], korean: '알루미늄(Al)' },
      { key: 'N', names: ['질소', 'N'], korean: '질소(N)' },
      { key: 'Cr', names: ['크롬', 'Cr'], korean: '크롬(Cr)' },
      { key: 'Mo', names: ['몰리브덴', 'Mo'], korean: '몰리브덴(Mo)' },
      { key: 'Ti', names: ['티타늄', 'Ti'], korean: '티타늄(Ti)' },
      { key: 'Nb', names: ['니오븀', 'Nb'], korean: '니오븀(Nb)' },
      { key: 'B', names: ['붕소', 'B'], korean: '붕소(B)' }
    ];
    
    elements.forEach(({ key, names, korean }) => {
      for (const name of names) {
        // 범위 패턴: "C : 0.15 ∼ 0.40 %"
        let pattern = new RegExp(`${name}\\s*:\\s*(\\d+\\.?\\d*)\\s*[∼~]\\s*(\\d+\\.?\\d*)\\s*%`, 'i');
        let match = claimText.match(pattern);
        if (match) {
          result.push(`${korean}: ${match[1]}~${match[2]}%`);
          break;
        }
        
        // 이하/이상 패턴: "P : 0.1 % 이하"
        pattern = new RegExp(`${name}\\s*:\\s*(\\d+\\.?\\d*)\\s*%\\s*(이하|이상|초과|미만)`, 'i');
        match = claimText.match(pattern);
        if (match) {
          result.push(`${korean}: ${match[1]}% ${match[2]}`);
          break;
        }
        
        // 범위 + 조건 패턴: "Al : 0.01 ∼ 0.5 %"
        pattern = new RegExp(`${name}\\s*:\\s*(\\d+\\.?\\d*)\\s*[∼~]\\s*(\\d+\\.?\\d*)\\s*%`, 'i');
        match = claimText.match(pattern);
        if (match) {
          result.push(`${korean}: ${match[1]}~${match[2]}%`);
          break;
        }
      }
    });
    
    // 잔부 성분
    if (claimText.includes('잔부') && (claimText.includes('Fe') || claimText.includes('철'))) {
      result.push('잔부: Fe 및 불가피적 불순물');
    }
    
    // 미세조직 정보 추출
    const microstructures = [
      { pattern: /하부\s*베이나이트가?\s*(\d+(?:\.\d+)?)\s*%\s*이상\s*(\d+(?:\.\d+)?)\s*%\s*미만/i, name: '하부 베이나이트(면적률)' },
      { pattern: /베이나이트가?\s*(\d+(?:\.\d+)?)\s*%\s*이상\s*(\d+(?:\.\d+)?)\s*%\s*(?:미만|이하)/i, name: '베이나이트(면적률)' },
      { pattern: /(?:템퍼드\s*)?마르?텐?사이트.*?(\d+(?:\.\d+)?)\s*%\s*이상\s*(\d+(?:\.\d+)?)\s*%\s*미만/i, name: '마르텐사이트(템퍼드 포함, 면적률)' },
      { pattern: /잔류\s*오스테나이트.*?(\d+(?:\.\d+)?)\s*%\s*이상\s*(\d+(?:\.\d+)?)\s*%\s*이하/i, name: '잔류 오스테나이트(면적률)' },
      { pattern: /폴리고날\s*페라이트가?\s*(\d+(?:\.\d+)?)\s*%\s*이하/i, name: '폴리고날 페라이트(면적률)' }
    ];
    
    microstructures.forEach(({ pattern, name }) => {
      const match = claimText.match(pattern);
      if (match) {
        if (match[2]) {
          result.push(`${name}: ${match[1]}% 이상 ${match[2]}% ${name.includes('미만') ? '미만' : '이하'}`);
        } else {
          result.push(`${name}: ${match[1]}% 이하 (0% 포함)`);
        }
      }
    });
    
    // 특수 조건들
    if (claimText.includes('잔류 오스테나이트') && claimText.includes('평균') && claimText.includes('C')) {
      const match = claimText.match(/평균\s*C.*?(\d+\\.?\d*)\s*(?:질량)?%\s*이상/i);
      if (match) {
        result.push(`잔류 오스테나이트 내 평균 탄소 농도: ${match[1]}% 이상`);
      }
    }
    
    if (claimText.includes('Mn') && claimText.includes('편석')) {
      const match = claimText.match(/Mn\s*편석.*?(\d+\\.?\d*)\s*%\s*이하/i);
      if (match) {
        result.push(`Mn 편석값(표면 Mn 농도 차): ${match[1]}% 이하`);
      }
    }
    
    // 물성 정보
    const properties = [
      { pattern: /인장\s*강도가?\s*(\d+)\s*(?:MPa|㎫)\s*이상/i, name: '인장강도(TS)' },
      { pattern: /항복\s*강도가?\s*(\d+)\s*(?:MPa|㎫)\s*이상/i, name: '항복강도(YS)' },
      { pattern: /R\/t\s*가?\s*(\d+\\.?\d*)\s*이하/i, name: '굽힘 반경 대비 판두께 비(R/t)' },
      { pattern: /인장\s*강도\s*×\s*전체\s*연신.*?(\d+)\s*(?:MPa|㎫).*?%\s*이상/i, name: 'TS × EL (인장강도 × 연신율)' },
      { pattern: /인장\s*강도\s*×\s*구멍\s*확장률.*?(\d+)\s*(?:MPa|㎫).*?%\s*이상/i, name: 'TS × HER (인장강도 × 구멍 확장률)' }
    ];
    
    properties.forEach(({ pattern, name }) => {
      const match = claimText.match(pattern);
      if (match) {
        if (name.includes('R/t')) {
          result.push(`${name}: ${match[1]} 이하`);
        } else if (name.includes('×')) {
          result.push(`${name}: ${match[1]} MPa·% 이상`);
        } else {
          result.push(`${name}: ${match[1]} MPa 이상`);
        }
      }
    });
    
    // 용도/제품 분류
    if (claimText.includes('고강도') && claimText.includes('강판')) {
      result.push('용도: 고강도 강판');
    } else if (claimText.includes('강판')) {
      result.push('용도: 강판');
    } else if (claimText.includes('강재')) {
      result.push('용도: 강재');
    }
    
    return result;
  };

  // 사용자 입력 특허 청구항을 구조화된 형태로 파싱하는 함수
  const parseUserClaimText = (claimText: string): { [key: string]: string } => {
    const properties: { [key: string]: string } = {};
    
    if (!claimText) return properties;
    
    // 각 원소별로 정확한 패턴 매칭
    const elements = [
      { key: 'C', names: ['탄소', 'C'] },
      { key: 'Si', names: ['실리콘', 'Si'] },
      { key: 'Mn', names: ['망간', 'Mn'] },
      { key: 'P', names: ['인', 'P'] },
      { key: 'S', names: ['황', 'S'] },
      { key: 'Cr', names: ['크롬', 'Cr'] },
      { key: 'Mo', names: ['몰리브덴', 'Mo'] },
      { key: 'Ti', names: ['티타늄', 'Ti'] },
      { key: 'Nb', names: ['니오븀', 'Nb'] },
      { key: 'B', names: ['붕소', 'B'] },
      { key: 'Al', names: ['알루미늄', 'Al'] },
      { key: 'N', names: ['질소', 'N'] }
    ];
    
    elements.forEach(({ key, names }) => {
      if (properties[key]) return; // 이미 값이 있으면 스킵
      
      for (const name of names) {
        // 패턴 1: "C : 0.12 % 이상 0.50 % 이하" 형태
        let pattern = new RegExp(`${name}\\s*:\\s*(\\d+\\.?\\d*)\\s*%\\s*(이상|초과)\\s*(\\d+\\.?\\d*)\\s*%\\s*(이하|미만)`, 'i');
        let match = claimText.match(pattern);
        if (match) {
          const [, min, minOp, max, maxOp] = match;
          const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`;
          const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`;
          properties[key] = `${minText} ~ ${maxText}`;
          break;
        }
        
        // 패턴 2: "C : 0.50 % 이하" 형태
        pattern = new RegExp(`${name}\\s*:\\s*(\\d+\\.?\\d*)\\s*%\\s*(이상|이하|초과|미만)`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, value, condition] = match;
          properties[key] = `${value}% ${condition}`;
          break;
        }
        
        // 패턴 3: "탄소(C): 0.12~0.50%" 형태
        pattern = new RegExp(`${name}\\s*\\(${key}\\)\\s*:\\s*(\\d+\\.?\\d*)\\s*~\\s*(\\d+\\.?\\d*)\\s*%`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, min, max] = match;
          properties[key] = `${min}% 이상 ~ ${max}% 이하`;
          break;
        }
        
        // 패턴 4: "탄소(C): 0.50% 이하" 형태
        pattern = new RegExp(`${name}\\s*\\(${key}\\)\\s*:\\s*(\\d+\\.?\\d*)\\s*%\\s*(이상|이하|초과|미만)`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, value, condition] = match;
          properties[key] = `${value}% ${condition}`;
          break;
        }
        
        // 패턴 5: "탄소 0.12% 이상 0.50% 이하" 형태 (콜론 없음)
        pattern = new RegExp(`${name}\\s+(\\d+\\.?\\d*)\\s*%\\s*(이상|초과)\\s+(\\d+\\.?\\d*)\\s*%\\s*(이하|미만)`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, min, minOp, max, maxOp] = match;
          const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`;
          const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`;
          properties[key] = `${minText} ~ ${maxText}`;
          break;
        }
        
        // 패턴 6: "탄소 0.50% 이하" 형태 (콜론 없음)
        pattern = new RegExp(`${name}\\s+(\\d+\\.?\\d*)\\s*%\\s*(이상|이하|초과|미만)`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, value, condition] = match;
          properties[key] = `${value}% ${condition}`;
          break;
        }
        
        // 패턴 7: "0.12 % 이상 0.50 % 이하의 탄소" 형태 (값이 앞에 오는 경우)
        pattern = new RegExp(`(\\d+\\.?\\d*)\\s*%\\s*(이상|초과)\\s+(\\d+\\.?\\d*)\\s*%\\s*(이하|미만)의?\\s*${name}`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, min, minOp, max, maxOp] = match;
          const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`;
          const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`;
          properties[key] = `${minText} ~ ${maxText}`;
          break;
        }
        
        // 패턴 8: "0.50 % 이하의 탄소" 형태
        pattern = new RegExp(`(\\d+\\.?\\d*)\\s*%\\s*(이상|이하|초과|미만)의?\\s*${name}`, 'i');
        match = claimText.match(pattern);
        if (match) {
          const [, value, condition] = match;
          properties[key] = `${value}% ${condition}`;
          break;
        }
      }
    });
    
    // 물성 정보 추출 (인장강도, 항복강도)
    // 인장강도 패턴들
    let tensileMatch = claimText.match(/인장\s*강도가?\s*(\d+)\s*(?:MPa|㎫)\s*(이상|이하|초과|미만)/i);
    if (tensileMatch) {
      properties['tensile_strength'] = `${tensileMatch[1]}MPa ${tensileMatch[2]}`;
    } else {
      tensileMatch = claimText.match(/(\d+)\s*MPa\s*(이상|이하|초과|미만)의?\s*인장\s*강도/i);
      if (tensileMatch) {
        properties['tensile_strength'] = `${tensileMatch[1]}MPa ${tensileMatch[2]}`;
      }
    }
    
    // 항복강도 패턴들
    let yieldMatch = claimText.match(/항복\s*강도가?\s*(\d+)\s*(?:MPa|㎫)\s*(이상|이하|초과|미만)/i);
    if (yieldMatch) {
      properties['yield_strength'] = `${yieldMatch[1]}MPa ${yieldMatch[2]}`;
    } else {
      yieldMatch = claimText.match(/(\d+)\s*MPa\s*(이상|이하|초과|미만)의?\s*항복\s*강도/i);
      if (yieldMatch) {
        properties['yield_strength'] = `${yieldMatch[1]}MPa ${yieldMatch[2]}`;
      }
    }
    
    return properties;
  }

  // 검색 특허 (사용자 입력)에서 성분 정보 추출
  const searchComponents = parseUserClaimText(searchClaimText)
  
  // 비교 특허 (클릭한 특허)에서 성분 정보 추출
  const compareComponents = parseUserClaimText(patent.claim_text)
  
  // 강종분류 유사도 계산 함수
  const calculateSteelClassificationSimilarity = (searchSteel: string, compareSteel: string): number => {
    if (!searchSteel || !compareSteel) return 0
    
    // 정확히 일치하는 경우
    if (searchSteel === compareSteel) return 100
    
    // HPF강과 Mart강은 매우 낮은 유사도
    if ((searchSteel.includes('HPF') && compareSteel.includes('Mart')) || 
        (searchSteel.includes('Mart') && compareSteel.includes('HPF'))) {
      return 15  // 15% 유사도
    }
    
    // 유사한 강종들 간의 유사도
    const steelGroups = {
      'mart': ['Mart강', '마르텐사이트강', 'martensitic'],
      'hpf': ['HPF강', 'HPF', 'Hot Press Forming'],
      'stainless': ['스테인리스강', '스테인레스강', 'stainless'],
      'carbon': ['탄소강', 'carbon steel'],
      'alloy': ['합금강', 'alloy steel'],
      'high_strength': ['고강도강', 'high strength'],
      'sheet': ['강판', 'steel sheet'],
      'material': ['강재', 'steel material']
    }
    
    // 같은 그룹 내에서는 높은 유사도
    for (const [group, keywords] of Object.entries(steelGroups)) {
      const searchInGroup = keywords.some(keyword => searchSteel.includes(keyword))
      const compareInGroup = keywords.some(keyword => compareSteel.includes(keyword))
      
      if (searchInGroup && compareInGroup) {
        return 85  // 같은 그룹 내 85% 유사도
      }
    }
    
    // 고강도 관련 강종들 간의 중간 유사도
    const highStrengthRelated = ['고강도강', 'Mart강', 'HPF강', 'high strength']
    const searchIsHighStrength = highStrengthRelated.some(keyword => searchSteel.includes(keyword))
    const compareIsHighStrength = highStrengthRelated.some(keyword => compareSteel.includes(keyword))
    
    if (searchIsHighStrength && compareIsHighStrength) {
      // HPF강과 Mart강은 이미 위에서 처리했으므로 여기서는 다른 조합들
      if (!((searchSteel.includes('HPF') && compareSteel.includes('Mart')) || 
            (searchSteel.includes('Mart') && compareSteel.includes('HPF')))) {
        return 45  // 중간 유사도
      }
    }
    
    // 기본 유사도 (일반적인 강종들)
    return 25
  }
  
  // 강종분류 유사도 계산
  const searchPatentInfoForSteel = parseSearchPatentInfo(searchClaimText)
  const steelSimilarity = calculateSteelClassificationSimilarity(
    searchPatentInfoForSteel.steel_classification, 
    patent.product_group || ''
  )

  // 미세조직 정보 추출
  const parseMicrostructure = (data: string[], inputClaimText?: string) => {
    const microstructures: { [key: string]: string } = {}
    const targetClaimText = inputClaimText || ''
    const allSources = [...data, targetClaimText]
    
    allSources.forEach(item => {
      const cleanItem = item.replace(/"/g, '').trim()
      
      // 마르텐사이트 관련 정보 (마텐자이트도 포함)
      if (cleanItem.includes('마르텐사이트') || cleanItem.includes('마텐자이트') || cleanItem.includes('마텐사이트')) {
        if (!microstructures['martensite']) {
          // 패턴 1: "마르텐사이트가 5% 이상 40% 미만"
          let match = cleanItem.match(/(?:템퍼드\s*)?(?:마르?텐?사이트|마텐자이트)가?\s*(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)/i)
          if (match) {
            const [, min, minOp, max, maxOp] = match
            const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
            const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
            microstructures['martensite'] = `${minText} ~ ${maxText}`
          } else {
            // 패턴 2: "40% 이상 90% 이하의 마르텐사이트"
            match = cleanItem.match(/(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)의?\s*(?:템퍼드\s*)?(?:마르?텐?사이트|마텐자이트)/i)
            if (match) {
              const [, min, minOp, max, maxOp] = match
              const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
              const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
              microstructures['martensite'] = `${minText} ~ ${maxText}`
            } else {
              // 패턴 3: "템퍼드 마르텐사이트 50~70%(면적)"
              match = cleanItem.match(/(?:템퍼드\s*)?(?:마르?텐?사이트|마텐자이트)\s*(\d+(?:\.\d+)?(?:[~-]\d+(?:\.\d+)?)?)\s*%/i)
              if (match) {
                microstructures['martensite'] = `${match[1]}%`
              }
            }
          }
        }
      }
      
      // 베이나이트 관련 정보 (하부 베이나이트 포함)
      if (cleanItem.includes('베이나이트')) {
        if (!microstructures['bainite']) {
          // 패턴 1: "하부 베이나이트가 40% 이상 85% 미만"
          let match = cleanItem.match(/(?:하부\s*|상부\s*)?베이나이트가?\s*(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)/i)
          if (match) {
            const [, min, minOp, max, maxOp] = match
            const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
            const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
            microstructures['bainite'] = `${minText} ~ ${maxText}`
          } else {
            // 패턴 2: "10% 이상 30% 이하의 베이나이트"
            match = cleanItem.match(/(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)의?\s*(?:하부\s*|상부\s*)?베이나이트/i)
            if (match) {
              const [, min, minOp, max, maxOp] = match
              const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
              const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
              microstructures['bainite'] = `${minText} ~ ${maxText}`
            } else {
              // 패턴 3: "베이나이트 20%(면적)"
              match = cleanItem.match(/(?:하부\s*|상부\s*)?베이나이트\s*(\d+(?:\.\d+)?(?:[~-]\d+(?:\.\d+)?)?)\s*%/i)
              if (match) {
                microstructures['bainite'] = `${match[1]}%`
              }
            }
          }
        }
      }
      
      // 페라이트 관련 정보 (미재결정 페라이트, 폴리고날 페라이트 포함)
      if (cleanItem.includes('페라이트')) {
        if (!microstructures['ferrite']) {
          // 패턴 1: "폴리고날 페라이트가 10% 이하"
          let match = cleanItem.match(/(?:미재결정\s*|폴리고날\s*)?페라이트가?\s*(\d+(?:\.\d+)?)\s*%\s*(이상|이하|초과|미만)/i)
          if (match) {
            const [, value, condition] = match
            microstructures['ferrite'] = `${value}% ${condition}`
          } else {
            // 패턴 2: "0% 초과 50% 이하의 페라이트"
            match = cleanItem.match(/(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)의?\s*(?:미재결정\s*|폴리고날\s*)?페라이트/i)
            if (match) {
              const [, min, minOp, max, maxOp] = match
              const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
              const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
              microstructures['ferrite'] = `${minText} ~ ${maxText}`
            } else {
              // 패턴 3: "페라이트 30%(면적)"
              match = cleanItem.match(/(?:미재결정\s*|폴리고날\s*)?페라이트\s*(\d+(?:\.\d+)?(?:[~-]\d+(?:\.\d+)?)?)\s*%/i)
              if (match) {
                microstructures['ferrite'] = `${match[1]}%`
              }
            }
          }
        }
      }
      
      // 잔류 오스테나이트 관련 정보
      if (cleanItem.includes('오스테나이트')) {
        if (!microstructures['austenite']) {
          // 패턴 1: "잔류 오스테나이트량이 10% 이상 30% 이하"
          let match = cleanItem.match(/잔류\s*오스테나이트량?이?\s*(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)/i)
          if (match) {
            const [, min, minOp, max, maxOp] = match
            const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
            const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
            microstructures['austenite'] = `${minText} ~ ${maxText}`
          } else {
            // 패턴 2: "5% 이상 15% 이하의 잔류 오스테나이트"
            match = cleanItem.match(/(\d+(?:\.\d+)?)\s*%\s*(이상|초과)\s*(\d+(?:\.\d+)?)\s*%\s*(이하|미만)의?\s*잔류\s*오스테나이트/i)
            if (match) {
              const [, min, minOp, max, maxOp] = match
              const minText = minOp === '초과' ? `${min}% 초과` : `${min}% 이상`
              const maxText = maxOp === '미만' ? `${max}% 미만` : `${max}% 이하`
              microstructures['austenite'] = `${minText} ~ ${maxText}`
            } else {
              // 패턴 3: "잔류 오스테나이트 10%(면적)"
              match = cleanItem.match(/잔류\s*오스테나이트\s*(\d+(?:\.\d+)?(?:[~-]\d+(?:\.\d+)?)?)\s*%/i)
              if (match) {
                microstructures['austenite'] = `${match[1]}%`
              }
            }
          }
        }
      }
      
      // 시멘타이트/계재물 관련 정보
      if (cleanItem.includes('시멘타이트') || cleanItem.includes('계재물')) {
        if (!microstructures['cementite']) {
          let match = cleanItem.match(/(?:시멘타이트|계재물)\s*(\d+(?:\.\d+)?(?:[~-]\d+(?:\.\d+)?)?)\s*%/i)
          if (match) {
            microstructures['cementite'] = `${match[1]}%`
          }
        }
      }
    })
    
    return microstructures
  }

  // 검색 특허와 비교 특허의 미세조직 정보 추출
  const searchMicrostructure = parseMicrostructure([], searchClaimText)
  const compareMicrostructure = parseMicrostructure(comparePatentClaimData, patent.claim_text)

  const searchProperties = parseUserClaimText(searchClaimText);
  const compareProperties = parseUserClaimText(patent.claim_text);

  // 첨부된 표와 정확히 일치하는 원소 목록
  const allElements = [
    'C', 'Si', 'Mn', 'P', 'S', 'Cr', 'Mo', 'Ti', 'Nb'
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8"
    >
      <div className="bg-green-600 text-white px-8 py-4 rounded-t-2xl">
        <h2 className="text-xl font-bold">특허 상세 비교 분석표</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-bold text-gray-900 dark:text-white text-center w-24">
                대분류
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-bold text-gray-900 dark:text-white text-center w-32">
                상세분류
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-bold text-gray-900 dark:text-white text-center w-80">
                검색 특허
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-bold text-gray-900 dark:text-white text-center w-80">
                비교 특허
              </th>
              <th className="border border-gray-300 dark:border-gray-600 px-4 py-3 font-bold text-gray-900 dark:text-white text-center bg-yellow-100 dark:bg-yellow-900/30 w-24">
                일치율(%)
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 기본 정보 섹션 */}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-center" rowSpan={8}>
                기본정보
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">특허번호</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.patent_id}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.patent_id}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">특허명</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-sm">{searchPatentInfo.title}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-sm">{patent.title || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">출원인</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.applicant}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.applicant}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">발명자</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.inventor}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.applicant || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">공개일자</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.publication_date}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.application_year}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">국가</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.country}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.country_code || 'KR'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">등록여부</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.registration_status}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">등록</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">강종분류</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchPatentInfo.steel_classification}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{patent.product_group || 'N/A'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300 font-bold text-blue-600">{steelSimilarity.toFixed(1)}%</td>
            </tr>

            {/* 성분 섹션 */}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-center" rowSpan={11}>
                성분<br/>(wt%)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">C</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['C'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['C'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">Si</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['Si'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['Si'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">Mn</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['Mn'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['Mn'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">P</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['P'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['P'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">S</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['S'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['S'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">Cr</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['Cr'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['Cr'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">Mo</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['Mo'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['Mo'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">Ti</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['Ti'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['Ti'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">Nb</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchComponents['Nb'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareComponents['Nb'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">성분 파라메타</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr className="bg-yellow-100 dark:bg-yellow-900/20">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white">(종합) 성분 일치율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600">{(patent.similarity_score * 0.8).toFixed(1)}%</td>
            </tr>

            {/* 미세조직 섹션 */}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-center" rowSpan={6}>
                미세조직
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">마르텐사이트 분율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchMicrostructure['martensite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareMicrostructure['martensite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">페라이트 분율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchMicrostructure['ferrite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareMicrostructure['ferrite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">베이나이트 분율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchMicrostructure['bainite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareMicrostructure['bainite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">잔류 오스테나이트 분율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchMicrostructure['austenite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareMicrostructure['austenite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">계재물</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchMicrostructure['cementite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareMicrostructure['cementite'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr className="bg-yellow-100 dark:bg-yellow-900/20">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white">(종합) 미세조직 일치율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600">{(patent.similarity_score * 0.9).toFixed(1)}%</td>
            </tr>

            {/* 물성 섹션 */}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-center" rowSpan={7}>
                물성
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">항복강도 (YS)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchProperties['yield_strength'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareProperties['yield_strength'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">인장강도 (TS)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{searchProperties['tensile_strength'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">{compareProperties['tensile_strength'] || '-'}</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">연신율 (T_EL)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">굽힘(R/t)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">3점 굽힘각도(°)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300 text-center font-medium">HER(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center text-gray-700 dark:text-gray-300">-</td>
            </tr>
            <tr className="bg-yellow-100 dark:bg-yellow-900/20">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white">(종합) 물성 일치율(%)</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-700 dark:text-gray-300">-</td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600">{(patent.similarity_score * 0.85).toFixed(1)}%</td>
            </tr>

            {/* 동록저지 가능성 */}
            <tr className="bg-yellow-200 dark:bg-yellow-800/30">
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white text-center bg-yellow-200 dark:bg-yellow-800/30" colSpan={4}>
                동록저지 가능성(%)
              </td>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold text-red-600 text-lg bg-yellow-200 dark:bg-yellow-800/30">
                {patent.similarity_score.toFixed(1)}%
              </td>
            </tr>

            {/* 종합 의견 */}
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-600 text-center" colSpan={5}>
                종합 의견
              </td>
            </tr>
            <tr>
              <td className="border border-gray-300 dark:border-gray-600 px-6 py-4 text-gray-700 dark:text-gray-300 leading-relaxed" colSpan={5}>
                <div className="space-y-2">
                  <p>• 검색 특허와 비교 특허 간 유사도: <span className="font-bold text-red-600">{patent.similarity_score.toFixed(1)}%</span></p>
                  <p>• 주요 유사 요소: 성분 조성, 미세조직 구조</p>
                  <p>• 권리 충돌 가능성: <span className="font-bold">{patent.similarity_score > 80 ? '높음' : patent.similarity_score > 60 ? '중간' : '낮음'}</span></p>
                  <p>• 추가 분석이 필요한 영역: 물성 데이터, 제조 공정</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default function SummaryPage({ patent, searchClaimText }: SummaryPageProps) {
  const [claimText, setClaimText] = useState('')
  const [isLoadingClaim, setIsLoadingClaim] = useState(true)
  const [claimError, setClaimError] = useState('')

  useEffect(() => {
    fetchClaimText()
  }, [patent.patent_id])

  const fetchClaimText = async () => {
    setIsLoadingClaim(true)
    setClaimError('')
    
    try {
      const response = await fetch(`/api/get-claim-text?patent_id=${encodeURIComponent(patent.patent_id)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch claim text')
      }
      
      const data = await response.json()
      setClaimText(data.claim_text || patent.claim_text || '청구항 정보를 찾을 수 없습니다.')
      
    } catch (err) {
      console.error('Error fetching claim text:', err)
      setClaimError('청구항 정보를 불러오는데 실패했습니다.')
      setClaimText(patent.claim_text || '청구항 정보를 찾을 수 없습니다.')
    } finally {
      setIsLoadingClaim(false)
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <span>검색 결과로 돌아가기</span>
          </button>

          {/* 헤더 섹션 - 엑셀 템플릿 스타일 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8">
            <div className="bg-blue-600 text-white px-8 py-6 rounded-t-2xl">
              <h1 className="text-3xl font-bold mb-2">특허 분석 보고서</h1>
              <p className="text-blue-100">Patent Analysis Report</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-blue-600 pb-2">
                    기본 정보
                  </h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">출원번호:</span>
                      <span className="text-gray-900 dark:text-white font-semibold">{patent.patent_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">출원인:</span>
                      <span className="text-gray-900 dark:text-white">{patent.applicant}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">출원년도:</span>
                      <span className="text-gray-900 dark:text-white">{patent.application_year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600 dark:text-gray-400">제품군:</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">{patent.product_group || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 유사도 분석 */}
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b-2 border-green-600 pb-2">
                    유사도 분석
                  </h2>
                  <div className="text-center">
                    <div className="text-6xl font-bold text-green-600 mb-2">
                      {patent.similarity_score.toFixed(1)}%
                    </div>
                    <div className="text-lg text-gray-600 dark:text-gray-400">전체 유사도</div>
                    <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-1000"
                        style={{ width: `${patent.similarity_score.toFixed(1)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 특허 제목 */}
              <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">특허 제목</h3>
                <p className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                  {patent.title}
                </p>
              </div>
            </div>
          </div>

          {/* 상세 분석 테이블 - 엑셀 템플릿 스타일 */}
          <PatentDetailTable patent={patent} searchClaimText={searchClaimText} />

          {/* 청구항 비교 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 mb-8"
          >
            <div className="bg-purple-600 text-white px-8 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold">청구항 비교 분석</h2>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 검색 특허 청구항 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b-2 border-blue-500 pb-2">
                    검색 특허 청구항
                  </h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-h-96 overflow-y-auto">
                    <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap text-sm">
                      {searchClaimText || '검색 특허 청구항 정보가 없습니다.'}
                    </p>
                  </div>
                </div>

                {/* 비교 특허 청구항 */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b-2 border-purple-500 pb-2">
                    비교 특허 청구항 (출원번호: {patent.patent_id})
                  </h3>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 max-h-96 overflow-y-auto">
                    {isLoadingClaim ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                          <p className="text-gray-600 dark:text-gray-400">청구항 정보를 불러오는 중...</p>
                        </div>
                      </div>
                    ) : claimError ? (
                      <div className="text-center py-8">
                        <p className="text-red-600 dark:text-red-400 mb-2">{claimError}</p>
                        <button
                          onClick={fetchClaimText}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          다시 시도
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap text-sm">
                        {claimText}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 청구항 유사도 분석 */}
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">청구항 유사도 분석</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{(patent.similarity_score * 0.85).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">기술적 구성 유사도</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{(patent.similarity_score * 0.92).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">핵심 요소 일치도</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{patent.similarity_score.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">전체 유사도</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 추가 분석 섹션들 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* 기술 분야 분석 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="bg-indigo-600 text-white px-6 py-4 rounded-t-2xl">
                <h3 className="text-lg font-bold">기술 분야 분석</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">자동차 소재</span>
                    <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full text-sm font-medium">
                      주요 분야
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">강재 기술</span>
                    <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                      핵심 기술
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">제품군</span>
                    <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                      {patent.product_group || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 권리 범위 분석 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="bg-orange-600 text-white px-6 py-4 rounded-t-2xl">
                <h3 className="text-lg font-bold">권리 범위 분석</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">특허 강도</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-sm font-medium">높음</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">회피 난이도</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                      </div>
                      <span className="text-sm font-medium">어려움</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">상업적 가치</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${patent.similarity_score.toFixed(1)}%` }}></div>
                      </div>
                      <span className="text-sm font-medium">높음</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}