import pandas as pd
import numpy as np
import json
import os
import re
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import faiss
import pickle
from pathlib import Path

class PatentRAGSystem:
    """
    RAG (Retrieval-Augmented Generation) system for patent analysis
    """
    
    def __init__(self, csv_path: str = "data/patent_db_수정.csv", 
                 model_name: str = "all-MiniLM-L6-v2"):
        self.csv_path = csv_path
        self.model_name = model_name
        self.model = None
        self.patent_data = None
        self.embeddings = None
        self.index = None
        self.embeddings_cache_path = "data/patent_embeddings.pkl"
        self.index_cache_path = "data/patent_index.faiss"
        
    def initialize(self):
        """Initialize the RAG system"""
        print("Initializing Patent RAG System...")
        
        # Load SentenceTransformer model
        print("Loading SentenceTransformer model...")
        self.model = SentenceTransformer(self.model_name)
        
        # Load patent data
        print("Loading patent data...")
        self.load_patent_data()
        
        # Load or generate embeddings
        if self._embeddings_exist():
            print("Loading cached embeddings...")
            self.load_embeddings()
        else:
            print("Generating new embeddings...")
            self.generate_embeddings()
            self.save_embeddings()
        
        # Build FAISS index
        self.build_faiss_index()
        
        print("RAG System initialization complete!")
    
    def load_patent_data(self):
        """Load patent data from CSV"""
        try:
            self.patent_data = pd.read_csv(self.csv_path, encoding='utf-8')
            print(f"Loaded {len(self.patent_data)} patents from CSV")
            
            # Clean and preprocess data
            self.patent_data = self.patent_data.dropna(subset=['청구항1'])
            
            # Parse JSON strings in '청구항 키' column
            def safe_parse_json(json_str):
                try:
                    if pd.isna(json_str):
                        return []
                    return json.loads(json_str)
                except:
                    return []
            
            self.patent_data['parsed_keywords'] = self.patent_data['청구항 키'].apply(safe_parse_json)
            
        except Exception as e:
            print(f"Error loading patent data: {e}")
            raise
    
    def create_combined_text(self, row):
        """Create combined text for embedding from patent data"""
        # Combine title, claim, keywords, and product group
        title = str(row['발명의 명칭']) if pd.notna(row['발명의 명칭']) else ""
        claim = str(row['청구항1']) if pd.notna(row['청구항1']) else ""
        product_group = str(row['제품군']) if pd.notna(row['제품군']) else ""
        
        # Extract keywords from parsed JSON
        keywords = []
        if isinstance(row['parsed_keywords'], list):
            keywords = [str(kw).strip('"') for kw in row['parsed_keywords']]
        
        keywords_text = " ".join(keywords)
        
        # Combine all text including product group
        combined_text = f"제목: {title}\n청구항: {claim}\n키워드: {keywords_text}\n제품군: {product_group}"
        return combined_text
    
    def generate_embeddings(self):
        """Generate embeddings for all patents"""
        print("Generating embeddings for patent data...")
        
        # Create combined text for each patent
        combined_texts = []
        for idx, row in self.patent_data.iterrows():
            combined_text = self.create_combined_text(row)
            combined_texts.append(combined_text)
        
        # Generate embeddings
        self.embeddings = self.model.encode(combined_texts, show_progress_bar=True)
        print(f"Generated embeddings with shape: {self.embeddings.shape}")
    
    def save_embeddings(self):
        """Save embeddings to cache"""
        os.makedirs("data", exist_ok=True)
        with open(self.embeddings_cache_path, 'wb') as f:
            pickle.dump(self.embeddings, f)
        print(f"Embeddings saved to {self.embeddings_cache_path}")
    
    def load_embeddings(self):
        """Load embeddings from cache"""
        with open(self.embeddings_cache_path, 'rb') as f:
            self.embeddings = pickle.load(f)
        print(f"Embeddings loaded from {self.embeddings_cache_path}")
    
    def _embeddings_exist(self):
        """Check if cached embeddings exist"""
        return os.path.exists(self.embeddings_cache_path)
    
    def build_faiss_index(self):
        """Build FAISS index for fast similarity search"""
        print("Building FAISS index...")
        
        # Normalize embeddings for cosine similarity
        embeddings_normalized = self.embeddings / np.linalg.norm(self.embeddings, axis=1, keepdims=True)
        
        # Create FAISS index
        dimension = embeddings_normalized.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner Product for cosine similarity
        self.index.add(embeddings_normalized.astype('float32'))
        
        # Save index
        faiss.write_index(self.index, self.index_cache_path)
        print(f"FAISS index built and saved to {self.index_cache_path}")
    
    def search_similar_patents(self, query_text: str, top_k: int = 10) -> List[Dict[str, Any]]:
        """Search for similar patents using RAG"""
        print(f"Searching for similar patents to: {query_text[:100]}...")
        
        # Generate embedding for query
        query_embedding = self.model.encode([query_text])
        query_embedding_normalized = query_embedding / np.linalg.norm(query_embedding, axis=1, keepdims=True)
        
        # Search using FAISS
        similarities, indices = self.index.search(query_embedding_normalized.astype('float32'), top_k * 2)  # Get more candidates
        
        # Extract product group and steel grade from query text for comparison
        query_product_group = self._extract_product_group_from_query(query_text)
        query_steel_grade = self._extract_steel_grade_from_query(query_text)
        
        # Prepare results with enhanced scoring
        results = []
        for i, (similarity, idx) in enumerate(zip(similarities[0], indices[0])):
            if idx < len(self.patent_data):
                patent = self.patent_data.iloc[idx]
                
                # Create patent ID from application number or index
                patent_id = str(patent.get('출원번호', f'PATENT_{idx:04d}'))
                
                # 청구항1에서 직접 성분 정보 추출
                claim_text = str(patent['청구항1'])
                extracted_components = self._extract_components_from_claim(claim_text)
                
                # 기존 키워드와 추출된 성분 정보 결합
                keywords = patent['parsed_keywords'] if isinstance(patent['parsed_keywords'], list) else []
                enhanced_keywords = keywords + extracted_components
                
                # Calculate enhanced similarity score with product group and steel grade weighting
                base_similarity = float(similarity * 100)
                patent_product_group = str(patent.get('제품군', ''))
                patent_steel_grade = str(patent.get('강종분류', ''))
                
                # Apply product group and steel grade weighting
                enhanced_similarity = self._calculate_enhanced_similarity(
                    base_similarity, query_product_group, patent_product_group, 
                    query_steel_grade, patent_steel_grade, query_text, claim_text
                )
                
                result = {
                    "patent_id": patent_id,
                    "title": str(patent['발명의 명칭']),
                    "applicant": str(patent['출원인']),
                    "application_year": self._extract_year(patent.get('출원일', '')),
                    "similarity_score": enhanced_similarity,
                    "claim_text": claim_text,
                    "country_code": str(patent.get('국가코드', 'KR')),
                    "product_group": patent_product_group,
                    "steel_grade": patent_steel_grade,
                    "keywords": enhanced_keywords,
                    "base_similarity": base_similarity  # Keep original for reference
                }
                results.append(result)
        
        # Sort by enhanced similarity and return top_k
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        results = results[:top_k]
        
        print(f"Found {len(results)} similar patents with enhanced scoring")
        return results
    
    def _extract_product_group_from_query(self, query_text: str) -> str:
        """Extract product group information from query text"""
        # Define product group keywords
        product_group_keywords = {
            'Mart강': ['Mart강', '마르텐사이트강', 'martensitic', '마르텐사이트'],
            'HPF강': ['HPF강', 'HPF', 'Hot Press Forming', '핫프레스포밍'],
            '스테인리스강': ['스테인리스', '스테인레스', 'stainless'],
            '탄소강': ['탄소강', 'carbon steel'],
            '합금강': ['합금강', 'alloy steel'],
            '고강도강': ['고강도', 'high strength'],
            '강판': ['강판', 'steel sheet', 'steel plate'],
            '강재': ['강재', 'steel material'],
            '도금강판': ['도금', '아연도금', 'galvanized', 'coated'],
            '냉연강판': ['냉연', 'cold rolled'],
            '열연강판': ['열연', 'hot rolled']
        }
        
        query_lower = query_text.lower()
        
        for product_group, keywords in product_group_keywords.items():
            for keyword in keywords:
                if keyword.lower() in query_lower:
                    return product_group
        
        return ""
    
    def _extract_steel_grade_from_query(self, query_text: str) -> str:
        """Extract steel grade classification from query text"""
        # Define steel grade keywords with priority order
        steel_grade_keywords = {
            'HPF강': ['HPF강', 'HPF', 'Hot Press Forming', '핫프레스포밍', '핫스탬핑'],
            'Mart강': ['Mart강', '마르텐사이트강', 'martensitic steel', '마르텐사이트계'],
            'DP강': ['DP강', 'Dual Phase', '듀얼페이즈', 'dual phase'],
            'TRIP강': ['TRIP강', 'TRIP', 'transformation induced plasticity'],
            'CP강': ['CP강', 'Complex Phase', '복합조직강'],
            'TWIP강': ['TWIP강', 'TWIP', 'twinning induced plasticity'],
            'FB강': ['FB강', 'Ferrite Bainite', '페라이트베이나이트'],
            'IF강': ['IF강', 'Interstitial Free', '극저탄소강'],
            '고장력강': ['고장력강', 'high tensile', '고인장강도'],
            '초고장력강': ['초고장력강', 'ultra high tensile', 'UHTS'],
            '스테인리스강': ['스테인리스강', 'stainless steel', '스테인레스강'],
            '탄소강': ['탄소강', 'carbon steel'],
            '합금강': ['합금강', 'alloy steel'],
            '도금강판': ['도금강판', '아연도금강판', 'galvanized steel', 'coated steel'],
            '냉연강판': ['냉연강판', 'cold rolled steel'],
            '열연강판': ['열연강판', 'hot rolled steel']
        }
        
        query_lower = query_text.lower()
        
        # HPF강을 최우선으로 검사
        for steel_grade, keywords in steel_grade_keywords.items():
            for keyword in keywords:
                if keyword.lower() in query_lower:
                    return steel_grade
        
        return ""
    
    def _calculate_enhanced_similarity(self, base_similarity: float, query_product_group: str, 
                                     patent_product_group: str, query_steel_grade: str, 
                                     patent_steel_grade: str, query_text: str, claim_text: str) -> float:
        """Calculate enhanced similarity with product group and steel grade weighting"""
        
        # Start with base similarity
        enhanced_score = base_similarity
        
        # Product group matching bonus/penalty
        if query_product_group and patent_product_group:
            if query_product_group == patent_product_group:
                # Exact match: significant bonus
                enhanced_score *= 1.3  # 30% boost
                print(f"Product group exact match bonus: {query_product_group}")
            elif self._are_related_product_groups(query_product_group, patent_product_group):
                # Related groups: moderate bonus
                enhanced_score *= 1.15  # 15% boost
                print(f"Product group related bonus: {query_product_group} <-> {patent_product_group}")
            else:
                # Different groups: penalty
                enhanced_score *= 0.8  # 20% penalty
                print(f"Product group mismatch penalty: {query_product_group} <-> {patent_product_group}")
        
        # Additional severe penalty for HPF강 when searching for Mart강
        if ((query_product_group == 'Mart강' and patent_product_group == 'HPF강') or 
            (query_steel_grade == 'Mart강' and patent_steel_grade == 'HPF강')):
            enhanced_score *= 0.1  # Additional 90% penalty for HPF강 vs Mart강
            print(f"HPF강 vs Mart강 severe penalty applied: {enhanced_score:.1f}")
        elif ((query_product_group == 'HPF강' and patent_product_group == 'Mart강') or 
              (query_steel_grade == 'HPF강' and patent_steel_grade == 'Mart강')):
            enhanced_score *= 0.1  # Additional 90% penalty for Mart강 vs HPF강
            print(f"Mart강 vs HPF강 severe penalty applied: {enhanced_score:.1f}")
        
        # Steel grade matching bonus/penalty
        if query_steel_grade and patent_steel_grade:
            steel_grade_similarity = self._calculate_steel_grade_similarity(query_steel_grade, patent_steel_grade)
            if steel_grade_similarity >= 0.9:
                # Very high similarity: significant bonus
                enhanced_score *= 1.25  # 25% boost
                print(f"Steel grade high similarity bonus: {query_steel_grade} <-> {patent_steel_grade} ({steel_grade_similarity:.1%})")
            elif steel_grade_similarity >= 0.7:
                # High similarity: moderate bonus
                enhanced_score *= 1.15  # 15% boost
                print(f"Steel grade moderate similarity bonus: {query_steel_grade} <-> {patent_steel_grade} ({steel_grade_similarity:.1%})")
            elif steel_grade_similarity >= 0.5:
                # Medium similarity: small bonus
                enhanced_score *= 1.05  # 5% boost
                print(f"Steel grade small similarity bonus: {query_steel_grade} <-> {patent_steel_grade} ({steel_grade_similarity:.1%})")
            elif steel_grade_similarity >= 0.3:
                # Low similarity: small penalty
                enhanced_score *= 0.95  # 5% penalty
                print(f"Steel grade low similarity penalty: {query_steel_grade} <-> {patent_steel_grade} ({steel_grade_similarity:.1%})")
            elif steel_grade_similarity >= 0.1:
                # Very low similarity: significant penalty
                enhanced_score *= 0.75  # 25% penalty
                print(f"Steel grade mismatch penalty: {query_steel_grade} <-> {patent_steel_grade} ({steel_grade_similarity:.1%})")
            else:
                # Extremely low similarity (HPF vs Mart): severe penalty
                enhanced_score *= 0.15  # 85% penalty
                print(f"Steel grade extreme mismatch penalty: {query_steel_grade} <-> {patent_steel_grade} ({steel_grade_similarity:.1%})")
        
        # Additional technical content matching
        technical_bonus = self._calculate_technical_content_bonus(query_text, claim_text)
        enhanced_score *= (1 + technical_bonus)
        
        # Ensure score doesn't exceed 100
        enhanced_score = min(enhanced_score, 100.0)
        
        return enhanced_score
    
    def _calculate_steel_grade_similarity(self, grade1: str, grade2: str) -> float:
        """Calculate similarity between steel grades"""
        if grade1 == grade2:
            return 1.0
        
                 # Define steel grade similarity matrix
        similarity_matrix = {
            'HPF강': {
                'Mart강': 0.01,  # Extremely different steels
                'DP강': 0.3,
                'TRIP강': 0.25,
                'CP강': 0.35,
                'TWIP강': 0.2,
                'FB강': 0.4,
                '고장력강': 0.6,
                '초고장력강': 0.8,
                '스테인리스강': 0.1,
                '탄소강': 0.2,
                '합금강': 0.4
            },
            'Mart강': {
                'HPF강': 0.01,  # Extremely different steels
                'DP강': 0.4,
                'TRIP강': 0.35,
                'CP강': 0.5,
                'TWIP강': 0.3,
                'FB강': 0.6,
                '고장력강': 0.7,
                '초고장력강': 0.8,
                '스테인리스강': 0.2,
                '탄소강': 0.3,
                '합금강': 0.6
            },
            'DP강': {
                'HPF강': 0.3,
                'Mart강': 0.4,
                'TRIP강': 0.7,
                'CP강': 0.8,
                'TWIP강': 0.6,
                'FB강': 0.7,
                '고장력강': 0.8,
                '초고장력강': 0.7,
                '스테인리스강': 0.1,
                '탄소강': 0.3,
                '합금강': 0.5
            },
            'TRIP강': {
                'HPF강': 0.25,
                'Mart강': 0.35,
                'DP강': 0.7,
                'CP강': 0.75,
                'TWIP강': 0.8,
                'FB강': 0.6,
                '고장력강': 0.7,
                '초고장력강': 0.6,
                '스테인리스강': 0.1,
                '탄소강': 0.2,
                '합금강': 0.4
            },
            '고장력강': {
                'HPF강': 0.6,
                'Mart강': 0.7,
                'DP강': 0.8,
                'TRIP강': 0.7,
                'CP강': 0.8,
                'TWIP강': 0.6,
                'FB강': 0.7,
                '초고장력강': 0.9,
                '스테인리스강': 0.2,
                '탄소강': 0.5,
                '합금강': 0.6
            },
            '초고장력강': {
                'HPF강': 0.8,
                'Mart강': 0.8,
                'DP강': 0.7,
                'TRIP강': 0.6,
                'CP강': 0.7,
                'TWIP강': 0.5,
                'FB강': 0.6,
                '고장력강': 0.9,
                '스테인리스강': 0.1,
                '탄소강': 0.3,
                '합금강': 0.5
            }
        }
        
        # Check direct similarity
        if grade1 in similarity_matrix and grade2 in similarity_matrix[grade1]:
            return similarity_matrix[grade1][grade2]
        
        # Check reverse similarity
        if grade2 in similarity_matrix and grade1 in similarity_matrix[grade2]:
            return similarity_matrix[grade2][grade1]
        
        # Default similarity for unknown combinations
        return 0.1
    
    def _are_related_product_groups(self, group1: str, group2: str) -> bool:
        """Check if two product groups are related"""
        related_groups = {
            'Mart강': ['고강도강', 'HPF강'],
            'HPF강': ['고강도강', 'Mart강'],
            '고강도강': ['Mart강', 'HPF강'],
            '강판': ['도금강판', '냉연강판', '열연강판'],
            '도금강판': ['강판', '냉연강판'],
            '냉연강판': ['강판', '도금강판'],
            '열연강판': ['강판'],
            '스테인리스강': ['합금강'],
            '합금강': ['스테인리스강']
        }
        
        return group2 in related_groups.get(group1, [])
    
    def _calculate_technical_content_bonus(self, query_text: str, claim_text: str) -> float:
        """Calculate bonus based on technical content similarity"""
        bonus = 0.0
        
        # Check for common technical terms
        technical_terms = [
            '마르텐사이트', '베이나이트', '오스테나이트', '페라이트',
            '인장강도', '항복강도', '연신율', '굽힘',
            '탄소', '망간', '실리콘', '크롬', '몰리브덴',
            '열처리', '냉각', '가열', '템퍼링'
        ]
        
        query_lower = query_text.lower()
        claim_lower = claim_text.lower()
        
        common_terms = 0
        for term in technical_terms:
            if term in query_lower and term in claim_lower:
                common_terms += 1
        
        # Bonus based on number of common technical terms
        if common_terms > 0:
            bonus = min(common_terms * 0.02, 0.1)  # Max 10% bonus
        
        return bonus
    
    def _extract_year(self, date_str: str) -> int:
        """Extract year from date string"""
        try:
            if pd.isna(date_str) or not date_str:
                return 2020  # Default year
            
            # Try to extract year from various date formats
            date_str = str(date_str)
            if '-' in date_str:
                return int(date_str.split('-')[0])
            elif '/' in date_str:
                return int(date_str.split('/')[0])
            elif len(date_str) >= 4:
                return int(date_str[:4])
            else:
                return 2020
        except:
            return 2020
    
    def _extract_components_from_claim(self, claim_text: str) -> List[str]:
        """Extract component information directly from claim text"""
        components = []
        
        # 원소별 패턴 정의
        element_patterns = [
            (r'C\s*:\s*([\d.~%\s\w이상하내지]+)', 'C'),
            (r'Si\s*:\s*([\d.~%\s\w이상하내지]+)', 'Si'),
            (r'Mn\s*:\s*([\d.~%\s\w이상하내지]+)', 'Mn'),
            (r'P\s*:\s*([\d.~%\s\w이상하내지]+)', 'P'),
            (r'S\s*:\s*([\d.~%\s\w이상하내지]+)', 'S'),
            (r'Cr\s*:\s*([\d.~%\s\w이상하내지]+)', 'Cr'),
            (r'Mo\s*:\s*([\d.~%\s\w이상하내지]+)', 'Mo'),
            (r'Ti\s*:\s*([\d.~%\s\w이상하내지]+)', 'Ti'),
            (r'Nb\s*:\s*([\d.~%\s\w이상하내지]+)', 'Nb'),
            
            (r'(?:탄소|carbon)\s*\(?\s*C\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'C'),
            (r'(?:실리콘|silicon)\s*\(?\s*Si\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'Si'),
            (r'(?:망간|manganese)\s*\(?\s*Mn\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'Mn'),
            (r'(?:인|phosphorus)\s*\(?\s*P\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'P'),
            (r'(?:황|sulfur)\s*\(?\s*S\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'S'),
            (r'(?:크롬|chromium)\s*\(?\s*Cr\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'Cr'),
            (r'(?:붕소|boron)\s*\(?\s*B\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'B'),
            (r'(?:알루미늄|aluminum)\s*\(?\s*Al\s*\)?\s*[:\s]*([\d.~%\s\w이상하내지]+)', 'Al'),
        ]
        
        # 미세조직 패턴
        microstructure_patterns = [
            (r'(?:마르텐사이트|마텐자이트|martensite).*?(\d+\s*%[^,]*)', '마르텐사이트'),
            (r'(?:베이나이트|bainite).*?(\d+\s*%[^,]*)', '베이나이트'),
            (r'(?:오스테나이트|austenite).*?(\d+\s*%[^,]*)', '오스테나이트'),
            (r'(?:페라이트|ferrite).*?(\d+\s*%[^,]*)', '페라이트'),
            (r'(?:펄라이트|pearlite).*?(\d+\s*%[^,]*)', '펄라이트'),
        ]
        
        # 원소 정보 추출
        for pattern, element in element_patterns:
            matches = re.findall(pattern, claim_text, re.IGNORECASE)
            for match in matches:
                value = match.strip()
                # 불필요한 텍스트 제거
                value = re.sub(r'를?\s*함유하고?', '', value).strip()
                if value:
                    components.append(f"{element}: {value}")
        
        # 미세조직 정보 추출
        for pattern, structure in microstructure_patterns:
            matches = re.findall(pattern, claim_text, re.IGNORECASE)
            for match in matches:
                components.append(f"{structure}: {match.strip()}")
        
        # 기계적 성질 추출
        mechanical_patterns = [
            (r'인장\s*강도.*?(\d+\s*[MG]?Pa[^,]*)', '인장강도'),
            (r'항복\s*강도.*?(\d+\s*[MG]?Pa[^,]*)', '항복강도'),
            (r'연신.*?(\d+\s*%[^,]*)', '연신율'),
            (r'굽힘.*?(\d+\s*도?[^,]*)', '굽힘성'),
        ]
        
        for pattern, property_name in mechanical_patterns:
            matches = re.findall(pattern, claim_text, re.IGNORECASE)
            for match in matches:
                components.append(f"{property_name}: {match.strip()}")
        
        return components
    
    def get_context_for_summarization(self, patent_data: Dict[str, Any], 
                                    similar_patents: List[Dict[str, Any]]) -> str:
        """Generate context for RAG-based summarization"""
        
        # Main patent information
        context = f"""
분석 대상 특허:
- 제목: {patent_data.get('title', 'N/A')}
- 출원인: {patent_data.get('applicant', 'N/A')}
- 출원년도: {patent_data.get('application_year', 'N/A')}
- 청구항: {patent_data.get('claim_text', 'N/A')}

유사 특허 분석 (상위 5개):
"""
        
        # Add similar patents context
        for i, similar in enumerate(similar_patents[:5], 1):
            context += f"""
{i}. {similar['title']} (유사도: {similar['similarity_score']:.1f}%)
   - 출원인: {similar['applicant']}
   - 출원년도: {similar['application_year']}
   - 핵심 기술: {', '.join(similar['keywords'][:3]) if similar['keywords'] else '정보 없음'}
"""
        
        # Add technology trend analysis
        context += f"""

기술 동향 분석:
- 총 {len(similar_patents)}개의 유사 특허 발견
- 주요 출원인: {', '.join(set([p['applicant'] for p in similar_patents[:5]]))}
- 출원년도 분포: {sorted(set([p['application_year'] for p in similar_patents[:5]]))}
"""
        
        return context
    
    def enhanced_similarity_search(self, query_text: str, filters: Optional[Dict] = None, 
                                 top_k: int = 10) -> List[Dict[str, Any]]:
        """Enhanced similarity search with filtering options"""
        
        # Get initial results
        results = self.search_similar_patents(query_text, top_k * 2)  # Get more for filtering
        
        # Apply filters if provided
        if filters:
            filtered_results = []
            for result in results:
                include = True
                
                # Filter by country
                if 'country' in filters and result['country_code'] not in filters['country']:
                    include = False
                
                # Filter by year range
                if 'year_range' in filters:
                    year_min, year_max = filters['year_range']
                    if not (year_min <= result['application_year'] <= year_max):
                        include = False
                
                # Filter by applicant
                if 'applicant' in filters:
                    if not any(app.lower() in result['applicant'].lower() 
                             for app in filters['applicant']):
                        include = False
                
                # Filter by minimum similarity
                if 'min_similarity' in filters:
                    if result['similarity_score'] < filters['min_similarity']:
                        include = False
                
                if include:
                    filtered_results.append(result)
            
            results = filtered_results[:top_k]
        
        return results[:top_k]
    
    def get_patent_statistics(self) -> Dict[str, Any]:
        """Get statistics about the patent database"""
        if self.patent_data is None:
            return {}
        
        stats = {
            "total_patents": len(self.patent_data),
            "countries": self.patent_data['국가코드'].value_counts().to_dict(),
            "top_applicants": self.patent_data['출원인'].value_counts().head(10).to_dict(),
            "year_distribution": self.patent_data['출원일'].apply(self._extract_year).value_counts().sort_index().to_dict(),
            "avg_claim_length": self.patent_data['청구항1'].str.len().mean() if '청구항1' in self.patent_data.columns else 0
        }
        
        return stats
    
    def get_claim_text_by_patent_id(self, patent_id: str) -> str:
        """Get claim text for a specific patent ID"""
        if self.patent_data is None:
            return ""
        
        try:
            # Find the patent by ID
            patent_row = self.patent_data[self.patent_data['출원번호'] == patent_id]
            
            if patent_row.empty:
                print(f"Patent with ID {patent_id} not found")
                return ""
            
            # Get the claim text (청구항1)
            claim_text = patent_row['청구항1'].iloc[0]
            
            if pd.isna(claim_text) or not claim_text:
                print(f"No claim text found for patent {patent_id}")
                return ""
            
            return str(claim_text).strip()
            
        except Exception as e:
            print(f"Error getting claim text for patent {patent_id}: {e}")
            return ""

# Global RAG system instance
rag_system = None

def get_rag_system() -> PatentRAGSystem:
    """Get or create global RAG system instance"""
    global rag_system
    if rag_system is None:
        rag_system = PatentRAGSystem()
        rag_system.initialize()
    return rag_system

def initialize_rag_system():
    """Initialize the global RAG system"""
    global rag_system
    rag_system = PatentRAGSystem()
    rag_system.initialize()
    return rag_system 