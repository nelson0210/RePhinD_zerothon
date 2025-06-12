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
    
    def __init__(self, csv_path: str = "data/patent_db_수정_csv_10개.csv", 
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
        # Combine title, claim, and keywords
        title = str(row['발명의 명칭']) if pd.notna(row['발명의 명칭']) else ""
        claim = str(row['청구항1']) if pd.notna(row['청구항1']) else ""
        
        # Extract keywords from parsed JSON
        keywords = []
        if isinstance(row['parsed_keywords'], list):
            keywords = [str(kw).strip('"') for kw in row['parsed_keywords']]
        
        keywords_text = " ".join(keywords)
        
        # Combine all text
        combined_text = f"제목: {title}\n청구항: {claim}\n키워드: {keywords_text}"
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
        similarities, indices = self.index.search(query_embedding_normalized.astype('float32'), top_k)
        
        # Prepare results
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
                
                result = {
                    "patent_id": patent_id,
                    "title": str(patent['발명의 명칭']),
                    "applicant": str(patent['출원인']),
                    "application_year": self._extract_year(patent.get('출원일', '')),
                    "similarity_score": float(similarity * 100),  # Convert to percentage
                    "claim_text": claim_text,
                    "country_code": str(patent.get('국가코드', 'KR')),
                    "keywords": enhanced_keywords
                }
                results.append(result)
        
        print(f"Found {len(results)} similar patents")
        return results
    
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
            (r'V\s*:\s*([\d.~%\s\w이상하내지]+)', 'V'),
            (r'Cu\s*:\s*([\d.~%\s\w이상하내지]+)', 'Cu'),
            (r'Ni\s*:\s*([\d.~%\s\w이상하내지]+)', 'Ni'),
            (r'B\s*:\s*([\d.~%\s\w이상하내지]+)', 'B'),
            (r'N\s*:\s*([\d.~%\s\w이상하내지]+)', 'N'),
            (r'Al\s*:\s*([\d.~%\s\w이상하내지]+)', 'Al'),
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