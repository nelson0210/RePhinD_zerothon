#!/usr/bin/env python3
"""
Simplified backend runner without heavy ML dependencies
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import re
from typing import List, Dict, Any
import json

app = FastAPI(title="RePhinD API", description="Patent Similarity Search and Summarization API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Sample patent data for demonstration
SAMPLE_PATENTS = [
    {
        'patent_id': 'US001',
        'title': 'Method for wireless communication using antenna arrays',
        'applicant': 'TechCorp Inc.',
        'application_year': 2020,
        'claim_text': 'A method for wireless communication comprising: providing a plurality of antenna elements arranged in an array; controlling the phase and amplitude of signals transmitted from each antenna element; and establishing a communication link with a remote device.'
    },
    {
        'patent_id': 'US002',
        'title': 'System for data encryption in mobile devices',
        'applicant': 'SecureData LLC',
        'application_year': 2019,
        'claim_text': 'A system for data encryption comprising: a processor configured to execute encryption algorithms; a memory storing cryptographic keys; and a secure communication interface for transmitting encrypted data.'
    },
    {
        'patent_id': 'US003',
        'title': 'Apparatus for image processing with machine learning',
        'applicant': 'ImageAI Technologies',
        'application_year': 2021,
        'claim_text': 'An apparatus for image processing comprising: an image sensor for capturing digital images; a machine learning processor for analyzing image content; and an output interface for providing processed image data.'
    },
    {
        'patent_id': 'US004',
        'title': 'Method for battery optimization in electric vehicles',
        'applicant': 'ElectricMotion Corp.',
        'application_year': 2022,
        'claim_text': 'A method for battery optimization comprising: monitoring battery charge levels in real-time; adjusting power consumption based on usage patterns; and implementing predictive charging algorithms.'
    },
    {
        'patent_id': 'US005',
        'title': 'System for natural language processing',
        'applicant': 'LanguageTech Solutions',
        'application_year': 2020,
        'claim_text': 'A system for natural language processing comprising: a text input interface; a neural network processor for analyzing linguistic patterns; and a response generation module.'
    },
    {
        'patent_id': 'US006',
        'title': 'Apparatus for quantum computing operations',
        'applicant': 'QuantumSystems Inc.',
        'application_year': 2023,
        'claim_text': 'An apparatus for quantum computing comprising: a quantum processor with multiple qubits; a control system for manipulating quantum states; and a measurement interface for reading quantum results.'
    },
    {
        'patent_id': 'US007',
        'title': 'Method for blockchain-based transaction verification',
        'applicant': 'BlockChain Innovations',
        'application_year': 2021,
        'claim_text': 'A method for blockchain verification comprising: receiving transaction data; validating transaction integrity using cryptographic hashing; and recording verified transactions in a distributed ledger.'
    },
    {
        'patent_id': 'US008',
        'title': 'System for autonomous vehicle navigation',
        'applicant': 'AutoDrive Technologies',
        'application_year': 2022,
        'claim_text': 'A system for autonomous navigation comprising: multiple sensors for environmental detection; a processing unit for path planning; and actuators for vehicle control.'
    },
    {
        'patent_id': 'US009',
        'title': 'Apparatus for medical diagnostic imaging',
        'applicant': 'MedTech Diagnostics',
        'application_year': 2019,
        'claim_text': 'An apparatus for medical imaging comprising: an imaging sensor; a signal processing unit for image enhancement; and a display system for visualization.'
    },
    {
        'patent_id': 'US010',
        'title': 'Method for renewable energy storage optimization',
        'applicant': 'GreenEnergy Solutions',
        'application_year': 2023,
        'claim_text': 'A method for energy storage optimization comprising: monitoring renewable energy generation; controlling energy storage systems; and optimizing energy distribution based on demand patterns.'
    }
]

def simple_similarity_score(query_text: str, patent_text: str) -> float:
    """Simple keyword-based similarity scoring"""
    query_words = set(query_text.lower().split())
    patent_words = set(patent_text.lower().split())
    
    # Calculate Jaccard similarity
    intersection = len(query_words.intersection(patent_words))
    union = len(query_words.union(patent_words))
    
    if union == 0:
        return 0.0
    
    return (intersection / union) * 100

def extract_text_from_pdf(file_content: bytes) -> str:
    """Simulate PDF text extraction"""
    return "A method for wireless communication comprising: providing antenna elements for signal transmission and establishing communication links with remote devices."

def extract_claim_1(text: str) -> str:
    """Extract Claim 1 from patent text"""
    patterns = [
        r'(?:claim\s*1[.:]?\s*)(.*?)(?=\n\s*(?:claim\s*2|2\.|$))',
        r'(?:1\.\s*)(.*?)(?=\n\s*(?:2\.|$))',
        r'(?:claims?\s*1[.:]?\s*)(.*?)(?=\n\s*(?:claims?\s*2|2\.|$))'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE | re.DOTALL)
        if matches:
            claim_1 = matches[0].strip()
            claim_1 = re.sub(r'\s+', ' ', claim_1)
            return claim_1
    
    # If no specific claim 1 found, return the text as is
    return text.strip()

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
        results = []
        for patent in SAMPLE_PATENTS:
            similarity_score = simple_similarity_score(claim_text, patent['claim_text'])
            
            results.append({
                "patent_id": patent['patent_id'],
                "title": patent['title'],
                "applicant": patent['applicant'],
                "application_year": patent['application_year'],
                "similarity_score": round(similarity_score, 2),
                "claim_text": patent['claim_text']
            })
        
        # Sort by similarity score descending
        results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        return {"similar_patents": results[:10]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize-patent")
async def summarize_patent(request: Dict[str, Any]):
    """Generate AI summary for a patent"""
    patent_data_req = request.get("patent_data", {})
    
    if not patent_data_req:
        raise HTTPException(status_code=400, detail="Patent data is required")
    
    try:
        # Check if OpenAI API key is available
        openai_api_key = os.getenv("OPENAI_API_KEY")
        
        if not openai_api_key or openai_api_key == "your_openai_api_key_here":
            # Return a structured mock summary when no API key is provided
            mock_summary = f"""
**1. Technical Field**: {patent_data_req.get('title', 'N/A')} belongs to the technology domain of advanced electronic systems and communication technologies.

**2. Problem Solved**: This invention addresses the challenge of improving efficiency and performance in {patent_data_req.get('title', 'system operations').lower()}.

**3. Key Innovation**: The main innovative aspect is the integration of advanced processing techniques with optimized system architecture.

**4. Technical Components**: 
• Primary processing unit with enhanced capabilities
• Advanced control mechanisms
• Integrated communication interfaces
• Optimized data handling systems

**5. Advantages**: 
• Improved system performance and reliability
• Enhanced efficiency in processing operations
• Better integration with existing infrastructure
• Reduced operational complexity

**6. Potential Applications**: 
• Industrial automation systems
• Consumer electronics
• Telecommunications infrastructure
• Advanced computing platforms

**7. Technical Complexity**: **Medium** - The invention combines established technologies in a novel way, requiring specialized knowledge but building on well-understood principles.

Note: This analysis was generated with limited AI capabilities. For comprehensive analysis, please configure your OpenAI API key.
"""
            return {
                "patent_id": patent_data_req.get('patent_id'),
                "summary": mock_summary
            }
        
        # If API key is available, try to use OpenAI
        try:
            import openai
            
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

            openai.api_key = openai_api_key
            response = openai.chat.completions.create(
                model="gpt-4o",
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
            
        except ImportError:
            raise HTTPException(status_code=400, detail="OpenAI package not available. Please install openai package.")
        except Exception as openai_error:
            raise HTTPException(status_code=400, detail=f"OpenAI API error: {str(openai_error)}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)