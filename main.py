from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import fitz
import pdfplumber
import os
import re
from typing import List, Dict, Any
import json
from dotenv import load_dotenv
import openai
from rag_system import get_rag_system, PatentRAGSystem

# Load environment variables
load_dotenv()

app = FastAPI(title="RePhinD API", description="Patent Similarity Search and Summarization API with RAG")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Global RAG system
rag_system = None

@app.on_event("startup")
async def startup_event():
    """Initialize RAG system on startup"""
    global rag_system
    
    print("Initializing RAG system...")
    try:
        rag_system = get_rag_system()
        print("RAG system startup complete!")
    except Exception as e:
        print(f"Error initializing RAG system: {e}")
        # Fallback to basic system if RAG fails
        rag_system = None

def create_sample_patent_data():
    """Create sample patent data for demonstration"""
    sample_data = {
        'patent_id': ['US001', 'US002', 'US003', 'US004', 'US005', 'US006', 'US007', 'US008', 'US009', 'US010'],
        'title': [
            'Method for wireless communication using antenna arrays',
            'System for data encryption in mobile devices',
            'Apparatus for image processing with machine learning',
            'Method for battery optimization in electric vehicles',
            'System for natural language processing',
            'Apparatus for quantum computing operations',
            'Method for blockchain-based transaction verification',
            'System for autonomous vehicle navigation',
            'Apparatus for medical diagnostic imaging',
            'Method for renewable energy storage optimization'
        ],
        'applicant': [
            'TechCorp Inc.', 'SecureData LLC', 'ImageAI Technologies', 'ElectricMotion Corp.',
            'LanguageTech Solutions', 'QuantumSystems Inc.', 'BlockChain Innovations',
            'AutoDrive Technologies', 'MedTech Diagnostics', 'GreenEnergy Solutions'
        ],
        'application_year': [2020, 2019, 2021, 2022, 2020, 2023, 2021, 2022, 2019, 2023],
        'claim_text': [
            'A method for wireless communication comprising: providing a plurality of antenna elements arranged in an array; controlling the phase and amplitude of signals transmitted from each antenna element; and establishing a communication link with a remote device.',
            'A system for data encryption comprising: a processor configured to execute encryption algorithms; a memory storing cryptographic keys; and a secure communication interface for transmitting encrypted data.',
            'An apparatus for image processing comprising: an image sensor for capturing digital images; a machine learning processor for analyzing image content; and an output interface for providing processed image data.',
            'A method for battery optimization comprising: monitoring battery charge levels in real-time; adjusting power consumption based on usage patterns; and implementing predictive charging algorithms.',
            'A system for natural language processing comprising: a text input interface; a neural network processor for analyzing linguistic patterns; and a response generation module.',
            'An apparatus for quantum computing comprising: a quantum processor with multiple qubits; a control system for manipulating quantum states; and a measurement interface for reading quantum results.',
            'A method for blockchain verification comprising: receiving transaction data; validating transaction integrity using cryptographic hashing; and recording verified transactions in a distributed ledger.',
            'A system for autonomous navigation comprising: multiple sensors for environmental detection; a processing unit for path planning; and actuators for vehicle control.',
            'An apparatus for medical imaging comprising: an imaging sensor; a signal processing unit for image enhancement; and a display system for visualization.',
            'A method for energy storage optimization comprising: monitoring renewable energy generation; controlling energy storage systems; and optimizing energy distribution based on demand patterns.'
        ]
    }
    return pd.DataFrame(sample_data)

def extract_text_from_pdf(file_content: bytes) -> str:
    """Extract text from PDF file"""
    try:
        # Try with PyMuPDF first
        doc = fitz.open(stream=file_content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        
        if text.strip():
            return text
            
        # Fallback to pdfplumber if PyMuPDF fails
        with pdfplumber.open(file_content) as pdf:
            text = ""
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text
        
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text from PDF: {str(e)}")

def extract_claim_1(text: str) -> str:
    """Extract Claim 1 from patent text"""
    # Look for patterns like "1.", "Claim 1", etc.
    patterns = [
        r'(?:claim\s*1[.:]?\s*)(.*?)(?=\n\s*(?:claim\s*2|2\.|$))',
        r'(?:1\.\s*)(.*?)(?=\n\s*(?:2\.|$))',
        r'(?:claims?\s*1[.:]?\s*)(.*?)(?=\n\s*(?:claims?\s*2|2\.|$))'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        if matches:
            claim_1 = matches[0].strip()
            # Clean up the text
            claim_1 = re.sub(r'\s+', ' ', claim_1)
            return claim_1
    
    # If no specific claim 1 found, return first paragraph that looks like a claim
    paragraphs = text.split('\n\n')
    for paragraph in paragraphs:
        if len(paragraph.strip()) > 50 and ('comprising' in paragraph.lower() or 'method' in paragraph.lower() or 'system' in paragraph.lower()):
            return paragraph.strip()
    
    return ""

@app.get("/")
async def root():
    return {"message": "RePhinD API is running"}

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload PDF and extract Claim 1"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    
    try:
        content = await file.read()
        text = extract_text_from_pdf(content)
        claim_1 = extract_claim_1(text)
        
        if not claim_1:
            raise HTTPException(status_code=400, detail="Could not extract Claim 1 from PDF")
        
        return {"claim_text": claim_1}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-similar-patents")
async def search_similar_patents(request: Dict[str, Any]):
    """Search for similar patents using RAG system"""
    claim_text = request.get("claim_text", "")
    filters = request.get("filters", {})
    top_k = request.get("top_k", 10)
    
    if not claim_text:
        raise HTTPException(status_code=400, detail="Claim text is required")
    
    try:
        if rag_system is None:
            raise HTTPException(status_code=503, detail="RAG system not available")
        
        # Use RAG system for enhanced search
        if filters:
            results = rag_system.enhanced_similarity_search(claim_text, filters, top_k)
        else:
            results = rag_system.search_similar_patents(claim_text, top_k)
        
        # Add claim_key to results
        for result in results:
            # Convert keywords to JSON string for claim_key
            if 'keywords' in result:
                result['claim_key'] = json.dumps(result['keywords'], ensure_ascii=False)
                # Remove the keywords field as it's now in claim_key
                del result['keywords']
        
        return {"similar_patents": results}
    except Exception as e:
        print(f"Error in search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize-patent")
async def summarize_patent(request: Dict[str, Any]):
    """Generate RAG-enhanced AI summary for a patent"""
    patent_data_req = request.get("patent_data", {})
    
    if not patent_data_req:
        raise HTTPException(status_code=400, detail="Patent data is required")
    
    try:
        # Get similar patents for RAG context
        similar_patents = []
        rag_context = ""
        
        if rag_system and patent_data_req.get('claim_text'):
            try:
                similar_patents = rag_system.search_similar_patents(
                    patent_data_req['claim_text'], top_k=5
                )
                rag_context = rag_system.get_context_for_summarization(
                    patent_data_req, similar_patents
                )
            except Exception as e:
                print(f"Error getting RAG context: {e}")
        
        # Create RAG-enhanced prompt for GPT
        prompt = f"""
Please provide a comprehensive patent summary using the following information:

{rag_context if rag_context else f'''
분석 대상 특허:
- 제목: {patent_data_req.get('title', 'N/A')}
- 출원인: {patent_data_req.get('applicant', 'N/A')}
- 출원년도: {patent_data_req.get('application_year', 'N/A')}
- 청구항: {patent_data_req.get('claim_text', 'N/A')}
'''}

위의 정보를 바탕으로 다음 형식으로 특허 분석을 제공해주세요:

1. **기술 분야**: 이 특허가 다루는 기술 영역은 무엇인가요?

2. **해결 문제**: 이 발명이 해결하는 구체적인 문제나 과제는 무엇인가요?

3. **핵심 혁신**: 주요 혁신적 측면이나 기술적 기여는 무엇인가요?

4. **기술 구성요소**: 필수적인 기술 요소나 구성품은 무엇인가요?

5. **장점**: 이 발명이 제공하는 이익이나 개선사항은 무엇인가요?

6. **잠재적 응용**: 어떤 분야나 산업에 적용될 수 있나요?

7. **기술 복잡도**: 기술 복잡도를 평가하고 (낮음/보통/높음) 그 이유를 설명해주세요.

8. **경쟁 기술 분석**: {f"유사 특허 {len(similar_patents)}개를 바탕으로 경쟁 기술 현황을 분석해주세요." if similar_patents else "관련 기술 동향을 분석해주세요."}

각 섹션 아래에 명확하고 간결한 불릿 포인트로 응답을 작성해주세요.
"""

        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 특허 분석 전문가입니다. 특허 문서의 명확하고 구조화된 분석을 제공하세요. 유사 특허 정보가 있다면 이를 활용하여 더 깊이 있는 분석을 해주세요."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1500,
            temperature=0.3
        )
        
        summary = response.choices[0].message.content
        
        return {
            "patent_id": patent_data_req.get('patent_id'),
            "summary": summary,
            "similar_patents_count": len(similar_patents),
            "rag_enhanced": bool(rag_context)
        }
    except Exception as e:
        if "openai" in str(e).lower() or "api" in str(e).lower():
            raise HTTPException(status_code=400, detail="OpenAI API error. Please check your API key configuration.")
        print(f"Error in summarization: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)