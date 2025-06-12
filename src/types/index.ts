export interface Patent {
  patent_id: string
  title: string
  applicant: string
  application_year: number
  similarity_score: number
  claim_text: string
  claim_key?: string
  country_code?: string
  product_group?: string
}

export interface SearchResponse {
  similar_patents: Patent[]
}

export interface SummaryResponse {
  patent_id: string
  summary: string
}

export interface UploadResponse {
  claim_text: string
}