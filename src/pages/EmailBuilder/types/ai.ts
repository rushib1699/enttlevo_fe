export interface AIGenerationRequest {
  prompt: string
  style: EmailStyle
  model: AIModel
  tone?: string
  industry?: string
  targetAudience?: string
}

export interface EmailStyle {
  id: string
  name: string
  description: string
  preview: string
}

export interface AIModel {
  id: string
  name: string
  description: string
  provider: 'openai' | 'claude' | 'gemini'
}

export interface AIGenerationResponse {
  success: boolean
  template?: {
    subject: string
    components: any[]
  }
  error?: string
}

export const EMAIL_STYLES: EmailStyle[] = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean, minimalist design with plenty of whitespace',
    preview: 'Modern and sleek'
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional business email layout',
    preview: 'Professional and timeless'
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'Eye-catching design with strong colors and typography',
    preview: 'Vibrant and attention-grabbing'
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Product-focused with clear CTAs and pricing',
    preview: 'Sales-optimized layout'
  },
  {
    id: 'newsletter',
    name: 'Newsletter',
    description: 'Content-heavy layout for regular communications',
    preview: 'Information-rich design'
  }
]

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Most capable model for complex email generation',
    provider: 'openai'
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and efficient for most email tasks',
    provider: 'openai'
  },
  {
    id: 'claude-3',
    name: 'Claude 3',
    description: 'Excellent for creative and nuanced content',
    provider: 'claude'
  }
] 