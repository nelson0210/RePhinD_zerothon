# 🚀 RePhinD RAG 시스템 설치 가이드

## 📋 개요
이 가이드는 RAG(Retrieval-Augmented Generation) 기법을 활용한 향상된 특허 분석 시스템을 설치하는 방법을 안내합니다.

## 🔧 시스템 요구사항
- **Python**: 3.8 이상 (권장: 3.10+)
- **메모리**: 최소 8GB RAM (권장: 16GB+)
- **저장공간**: 최소 5GB 여유 공간
- **운영체제**: Windows 10/11, macOS, Linux

## 📦 설치 단계

### 1. 가상환경 생성 및 활성화

#### Windows (PowerShell)
```powershell
# 가상환경 생성
python -m venv venv

# 가상환경 활성화
.\venv\Scripts\Activate.ps1

# 또는 cmd에서
venv\Scripts\activate.bat
```

#### macOS/Linux
```bash
# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate
```

### 2. pip 업그레이드
```bash
python -m pip install --upgrade pip
```

### 3. 의존성 설치
```bash
pip install -r requirements.txt
```

### 4. 설치 확인
```bash
python -c "import faiss; import sentence_transformers; import pandas; print('✅ 모든 라이브러리가 성공적으로 설치되었습니다!')"
```

## 🔑 환경 변수 설정

### OpenAI API 키 설정 (선택사항)
AI 요약 기능을 사용하려면 OpenAI API 키가 필요합니다.

#### 방법 1: .env 파일 생성
```bash
# 프로젝트 루트에 .env 파일 생성
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
```

#### 방법 2: 환경 변수 직접 설정
```bash
# Windows
set OPENAI_API_KEY=your_openai_api_key_here

# macOS/Linux
export OPENAI_API_KEY=your_openai_api_key_here
```

## 🚀 시스템 실행

### 1. 백엔드 서버 시작
```bash
# RAG 기반 FastAPI 서버 실행
python main.py

# 또는 uvicorn 직접 실행
uvicorn main:app --reload --port 8000
```

### 2. 프론트엔드 개발 서버 시작 (별도 터미널)
```bash
# Node.js 의존성 설치 (최초 1회)
npm install

# 개발 서버 시작
npm run dev
```

### 3. 애플리케이션 접속
- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 📊 RAG 시스템 초기화

첫 실행 시 RAG 시스템이 자동으로 초기화됩니다:

1. **CSV 데이터 로드**: `data/patent_db_수정_csv_10개.csv` 파일 읽기
2. **임베딩 생성**: 특허 데이터의 벡터 임베딩 생성 (약 1-2분 소요)
3. **FAISS 인덱스 구축**: 빠른 검색을 위한 벡터 인덱스 생성
4. **캐시 저장**: 생성된 임베딩과 인덱스를 캐시로 저장

### 캐시 파일 위치
- **임베딩 캐시**: `data/patent_embeddings.pkl`
- **FAISS 인덱스**: `data/patent_index.faiss`

## 🔧 문제 해결

### 일반적인 문제들

#### 1. sentence-transformers 호환성 오류
```bash
# 최신 버전으로 업그레이드
pip install sentence-transformers==2.7.0
```

#### 2. FAISS 설치 오류
```bash
# CPU 버전 설치 (GPU 버전이 필요하지 않은 경우)
pip install faiss-cpu

# GPU 버전 (CUDA 환경)
pip install faiss-gpu
```

#### 3. 메모리 부족 오류
- 시스템 메모리를 확인하고 다른 프로그램을 종료
- 배치 크기를 줄이거나 더 작은 모델 사용 고려

#### 4. OpenAI API 오류
```bash
# API 키 확인
echo $OPENAI_API_KEY  # macOS/Linux
echo %OPENAI_API_KEY%  # Windows
```

### 로그 확인
```bash
# 백엔드 로그 확인
python main.py

# 상세 로그 출력
uvicorn main:app --reload --log-level debug
```

## 📈 성능 최적화

### 1. 하드웨어 최적화
- **SSD 사용**: 임베딩 로드 속도 향상
- **충분한 RAM**: 벡터 인덱스 메모리 로드
- **멀티코어 CPU**: 병렬 처리 성능 향상

### 2. 소프트웨어 최적화
```bash
# PyTorch CPU 최적화 (선택사항)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 3. 캐시 관리
```bash
# 캐시 재생성 (데이터 업데이트 시)
rm data/patent_embeddings.pkl data/patent_index.faiss
python main.py
```

## 🔄 업데이트 가이드

### 1. 코드 업데이트
```bash
git pull origin main
pip install -r requirements.txt
```

### 2. 데이터 업데이트
새로운 특허 데이터를 추가한 경우:
```bash
# 기존 캐시 삭제
rm data/patent_embeddings.pkl data/patent_index.faiss

# 서버 재시작으로 자동 재생성
python main.py
```

## 📚 추가 리소스

### API 문서
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 주요 라이브러리 문서
- [FastAPI](https://fastapi.tiangolo.com/)
- [Sentence Transformers](https://www.sbert.net/)
- [FAISS](https://faiss.ai/)
- [OpenAI API](https://platform.openai.com/docs)

## 🆘 지원

### 문제 신고
- GitHub Issues를 통한 버그 리포트
- 상세한 오류 메시지와 환경 정보 포함

### 기능 요청
- GitHub Discussions를 통한 기능 제안
- 사용 사례와 예상 효과 설명

---

**🎉 설치 완료!** 이제 RAG 기반 특허 분석 시스템을 사용할 수 있습니다. 