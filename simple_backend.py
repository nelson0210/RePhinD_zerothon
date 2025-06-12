#!/usr/bin/env python3
import json
import os
import re
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import urllib.request
import ssl

class PatentAPIHandler(BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {"message": "RePhinD API is running"}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        if self.path == '/upload-pdf':
            self._handle_upload_pdf(post_data)
        elif self.path == '/search-similar-patents':
            self._handle_search_patents(post_data)
        elif self.path == '/summarize-patent':
            self._handle_summarize_patent(post_data)
        else:
            self.send_response(404)
            self.end_headers()

    def _handle_upload_pdf(self, post_data):
        self.send_response(200)
        self._set_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        # Simulate PDF text extraction
        response = {
            "claim_text": "A method for wireless communication comprising: providing antenna elements for signal transmission and establishing communication links with remote devices."
        }
        self.wfile.write(json.dumps(response).encode())

    def _handle_search_patents(self, post_data):
        try:
            data = json.loads(post_data.decode())
            claim_text = data.get("claim_text", "")
            
            if not claim_text:
                self.send_response(400)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({"detail": "Claim text is required"}).encode())
                return

            # Sample patent data with realistic similarity scoring
            patents = self._get_sample_patents()
            results = []
            
            for patent in patents:
                similarity = self._calculate_similarity(claim_text, patent['claim_text'])
                results.append({
                    "patent_id": patent['patent_id'],
                    "title": patent['title'],
                    "applicant": patent['applicant'],
                    "application_year": patent['application_year'],
                    "similarity_score": similarity,
                    "claim_text": patent['claim_text']
                })
            
            # Sort by similarity
            results.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"similar_patents": results[:10]}).encode())
            
        except Exception as e:
            self.send_response(500)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode())

    def _handle_summarize_patent(self, post_data):
        try:
            data = json.loads(post_data.decode())
            patent_data = data.get("patent_data", {})
            
            openai_key = os.getenv("OPENAI_API_KEY")
            
            if openai_key and openai_key != "your_openai_api_key_here":
                summary = self._get_openai_summary(patent_data, openai_key)
            else:
                summary = self._get_mock_summary(patent_data)
            
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "patent_id": patent_data.get('patent_id'),
                "summary": summary
            }
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"detail": str(e)}).encode())

    def _get_openai_summary(self, patent_data, api_key):
        try:
            prompt = f"""
Please provide a comprehensive patent summary for:

Patent Title: {patent_data.get('title', 'N/A')}
Applicant: {patent_data.get('applicant', 'N/A')}
Application Year: {patent_data.get('application_year', 'N/A')}
Claim Text: {patent_data.get('claim_text', 'N/A')}

Provide analysis in this format:

1. **Technical Field**: Technology domain
2. **Problem Solved**: Specific challenge addressed
3. **Key Innovation**: Main innovative aspect
4. **Technical Components**: Essential elements
5. **Advantages**: Benefits provided
6. **Potential Applications**: Industry applications
7. **Technical Complexity**: Rate and explain (Low/Medium/High)

Format as clear bullet points under each section.
"""

            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "model": "gpt-4o",
                "messages": [
                    {"role": "system", "content": "You are a patent analysis expert. Provide clear, structured analysis."},
                    {"role": "user", "content": prompt}
                ],
                "max_tokens": 1000,
                "temperature": 0.3
            }
            
            req = urllib.request.Request(
                'https://api.openai.com/v1/chat/completions',
                data=json.dumps(payload).encode(),
                headers=headers
            )
            
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, context=ctx) as response:
                result = json.loads(response.read().decode())
                return result['choices'][0]['message']['content']
                
        except Exception as e:
            return self._get_mock_summary(patent_data)

    def _get_mock_summary(self, patent_data):
        return f"""**1. Technical Field**: {patent_data.get('title', 'This patent')} operates in the domain of advanced electronic systems and communication technologies.

**2. Problem Solved**: 
• Addresses efficiency challenges in system operations
• Improves reliability of existing processes
• Reduces operational complexity

**3. Key Innovation**: 
• Integration of advanced processing techniques
• Novel system architecture design
• Optimized performance algorithms

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

**7. Technical Complexity**: **Medium** - Combines established technologies in novel ways, requiring specialized knowledge but building on well-understood principles.

Note: For comprehensive analysis with real AI insights, please configure your OpenAI API key."""

    def _calculate_similarity(self, query, patent_text):
        query_words = set(query.lower().split())
        patent_words = set(patent_text.lower().split())
        
        if not query_words or not patent_words:
            return 0.0
            
        intersection = len(query_words.intersection(patent_words))
        union = len(query_words.union(patent_words))
        
        if union == 0:
            return 0.0
            
        return round((intersection / union) * 100, 2)

    def _get_sample_patents(self):
        return [
            {
                'patent_id': 'US10123456',
                'title': 'Method for wireless communication using antenna arrays',
                'applicant': 'TechCorp Inc.',
                'application_year': 2020,
                'claim_text': 'A method for wireless communication comprising: providing a plurality of antenna elements arranged in an array; controlling the phase and amplitude of signals transmitted from each antenna element; and establishing a communication link with a remote device.'
            },
            {
                'patent_id': 'US10234567',
                'title': 'System for data encryption in mobile devices',
                'applicant': 'SecureData LLC',
                'application_year': 2019,
                'claim_text': 'A system for data encryption comprising: a processor configured to execute encryption algorithms; a memory storing cryptographic keys; and a secure communication interface for transmitting encrypted data.'
            },
            {
                'patent_id': 'US10345678',
                'title': 'Apparatus for image processing with machine learning',
                'applicant': 'ImageAI Technologies',
                'application_year': 2021,
                'claim_text': 'An apparatus for image processing comprising: an image sensor for capturing digital images; a machine learning processor for analyzing image content; and an output interface for providing processed image data.'
            },
            {
                'patent_id': 'US10456789',
                'title': 'Method for battery optimization in electric vehicles',
                'applicant': 'ElectricMotion Corp.',
                'application_year': 2022,
                'claim_text': 'A method for battery optimization comprising: monitoring battery charge levels in real-time; adjusting power consumption based on usage patterns; and implementing predictive charging algorithms.'
            },
            {
                'patent_id': 'US10567890',
                'title': 'System for natural language processing',
                'applicant': 'LanguageTech Solutions',
                'application_year': 2020,
                'claim_text': 'A system for natural language processing comprising: a text input interface; a neural network processor for analyzing linguistic patterns; and a response generation module.'
            },
            {
                'patent_id': 'US10678901',
                'title': 'Apparatus for quantum computing operations',
                'applicant': 'QuantumSystems Inc.',
                'application_year': 2023,
                'claim_text': 'An apparatus for quantum computing comprising: a quantum processor with multiple qubits; a control system for manipulating quantum states; and a measurement interface for reading quantum results.'
            },
            {
                'patent_id': 'US10789012',
                'title': 'Method for blockchain-based transaction verification',
                'applicant': 'BlockChain Innovations',
                'application_year': 2021,
                'claim_text': 'A method for blockchain verification comprising: receiving transaction data; validating transaction integrity using cryptographic hashing; and recording verified transactions in a distributed ledger.'
            },
            {
                'patent_id': 'US10890123',
                'title': 'System for autonomous vehicle navigation',
                'applicant': 'AutoDrive Technologies',
                'application_year': 2022,
                'claim_text': 'A system for autonomous navigation comprising: multiple sensors for environmental detection; a processing unit for path planning; and actuators for vehicle control.'
            },
            {
                'patent_id': 'US10901234',
                'title': 'Apparatus for medical diagnostic imaging',
                'applicant': 'MedTech Diagnostics',
                'application_year': 2019,
                'claim_text': 'An apparatus for medical imaging comprising: an imaging sensor; a signal processing unit for image enhancement; and a display system for visualization.'
            },
            {
                'patent_id': 'US11012345',
                'title': 'Method for renewable energy storage optimization',
                'applicant': 'GreenEnergy Solutions',
                'application_year': 2023,
                'claim_text': 'A method for energy storage optimization comprising: monitoring renewable energy generation; controlling energy storage systems; and optimizing energy distribution based on demand patterns.'
            }
        ]

def run_server():
    server_address = ('0.0.0.0', 8000)
    httpd = HTTPServer(server_address, PatentAPIHandler)
    print("RePhinD Backend API running on http://0.0.0.0:8000")
    print("Server ready to accept connections...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Server stopped.")
        httpd.server_close()

if __name__ == "__main__":
    run_server()