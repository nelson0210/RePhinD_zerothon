from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import PyMuPDF as fitz
import pdfplumber
import os
import re
from typing import List, Dict, Any
import json
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

app = FastAPI(title="RePhinD API", description="Patent Similarity Search and Summarization API")

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

# Global variables for models and data
model = None
patent_data = None
patent_embeddings = None

@app.on_event("startup")
async def startup_event():
    """Initialize models and load data on startup"""
    global model, patent_data, patent_embeddings
    
    # Load SentenceTransformer model
    print("Loading SentenceTransformer model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Load patent data (will be replaced with actual CSV data)
    print("Loading patent data...")
    patent_data = create_sample_patent_data()
    
    # Generate embeddings for patent data
    print("Generating patent embeddings...")
    patent_texts = patent_data['claim_text'].tolist()
    patent_embeddings = model.encode(patent_texts)
    
    print("Startup complete!")

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
    """Search for similar patents based on claim text"""
    claim_text = request.get("claim_text", "")
    
    if not claim_text:
        raise HTTPException(status_code=400, detail="Claim text is required")
    
    try:
        # Generate embedding for the input claim
        query_embedding = model.encode([claim_text])
        
        # Calculate similarities
        similarities = cosine_similarity(query_embedding, patent_embeddings)[0]
        
        # Get top 10 similar patents
        top_indices = np.argsort(similarities)[::-1][:10]
        
        results = []
        for idx in top_indices:
            similarity_score = float(similarities[idx]) * 100  # Convert to percentage
            patent = patent_data.iloc[idx]
            
            results.append({
                "patent_id": patent['patent_id'],
                "title": patent['title'],
                "applicant": patent['applicant'],
                "application_year": int(patent['application_year']),
                "similarity_score": round(similarity_score, 2),
                "claim_text": patent['claim_text']
            })
        
        return {"similar_patents": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize-patent")
async def summarize_patent(request: Dict[str, Any]):
    """Generate AI summary for a patent"""
    patent_data_req = request.get("patent_data", {})
    
    if not patent_data_req:
        raise HTTPException(status_code=400, detail="Patent data is required")
    
    try:
        # Create a comprehensive prompt for GPT
        prompt = f"""
Please provide a comprehensive patent summary in the following structured format:

Patent Title: {patent_data_req.get('title', 'N/A')}
Applicant: {patent_data_req.get('applicant', 'N/A')}
Application Year: {patent_data_req.get('application_year', 'N/A')}

Claim Text: {patent_data_req.get('claim_text', 'N/A')}

Please analyze this patent and provide:

1. **Technical Field**: What technology domain does this patent cover?

2. **Problem Solved**: What specific problem or challenge does this invention address?

3. **Key Innovation**: What is the main innovative aspect or technical contribution?

4. **Technical Components**: What are the essential technical elements or components?

5. **Advantages**: What benefits or improvements does this invention provide?

6. **Potential Applications**: In what areas or industries could this be applied?

7. **Technical Complexity**: Rate the technical complexity (Low/Medium/High) and explain why.

Format the response as clear, concise bullet points under each section.
"""

        # Call OpenAI API
        response = openai.chat.completions.create(
            model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {"role": "system", "content": "You are a patent analysis expert. Provide clear, structured analysis of patent documents."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        summary = response.choices[0].message.content
        
        return {
            "patent_id": patent_data_req.get('patent_id'),
            "summary": summary
        }
    except Exception as e:
        if "openai" in str(e).lower() or "api" in str(e).lower():
            raise HTTPException(status_code=400, detail="OpenAI API error. Please check your API key configuration.")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)