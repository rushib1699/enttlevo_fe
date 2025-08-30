import type { AIGenerationRequest, AIGenerationResponse } from '../types/ai'
import { createComponent } from './email-components'
import { v4 as uuidv4 } from 'uuid'

// Mock AI email generation function
export async function generateEmailWithAI(request: AIGenerationRequest): Promise<AIGenerationResponse> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  try {
    // Generate mock email based on prompt and style
    const components = generateMockComponents(request)
    const subject = generateMockSubject(request)

    return {
      success: true,
      template: {
        subject,
        components
      }
    }
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate email template'
    }
  }
}

function generateMockComponents(request: AIGenerationRequest) {
  const { prompt, style, tone, industry } = request
  
  // Create components based on style
  const components = []

  // Header/Title
  if (style.id === 'ecommerce') {
    components.push(createComponent('text', {
      content: extractTitleFromPrompt(prompt) || 'SPECIAL OFFER',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    }))
    
    components.push(createComponent('text', {
      content: 'Limited Time Sale - Don\'t Miss Out!',
      fontSize: '32px',
      fontWeight: 'bold',
      color: tone?.toLowerCase().includes('urgent') ? '#DC2626' : '#1F2937',
      textAlign: 'center',
    }))
    
    // Product image
    components.push(createComponent('image', {
      src: getImageForIndustry(industry),
      alt: 'Featured Product',
      width: '100%',
      height: 'auto',
    }))
    
    // Description
    components.push(createComponent('paragraph', {
      content: generateDescription(prompt, tone),
      fontSize: '16px',
      color: '#374151',
      lineHeight: '1.6',
      textAlign: 'center',
    }))
    
    // CTA Button
    components.push(createComponent('button', {
      text: tone?.toLowerCase().includes('urgent') ? 'Shop Now - Limited Time!' : 'Shop Now',
      href: '#',
      backgroundColor: style.id === 'bold' ? '#DC2626' : '#D97706',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '6px',
      textAlign: 'center',
    }))
  } else if (style.id === 'modern') {
    // Clean, minimal design
    components.push(createComponent('text', {
      content: extractTitleFromPrompt(prompt) || 'Hello',
      fontSize: '28px',
      fontWeight: '300',
      color: '#1F2937',
      textAlign: 'left',
    }))
    
    components.push(createComponent('paragraph', {
      content: generateDescription(prompt, tone),
      fontSize: '16px',
      color: '#6B7280',
      lineHeight: '1.7',
      textAlign: 'left',
    }))
    
    components.push(createComponent('button', {
      text: 'Learn More',
      href: '#',
      backgroundColor: '#000000',
      color: '#ffffff',
      padding: '14px 28px',
      borderRadius: '2px',
      textAlign: 'center',
    }))
  } else if (style.id === 'newsletter') {
    // Content-heavy layout
    components.push(createComponent('text', {
      content: extractTitleFromPrompt(prompt) || 'Newsletter',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1F2937',
      textAlign: 'center',
    }))
    
    components.push(createComponent('divider', {
      height: '2px',
      backgroundColor: '#E5E7EB',
      margin: '20px 0',
    }))
    
    components.push(createComponent('paragraph', {
      content: generateDescription(prompt, tone),
      fontSize: '16px',
      color: '#374151',
      lineHeight: '1.6',
      textAlign: 'left',
    }))
    
    components.push(createComponent('paragraph', {
      content: 'Stay updated with our latest news and insights.',
      fontSize: '14px',
      color: '#6B7280',
      lineHeight: '1.5',
      textAlign: 'center',
    }))
  } else {
    // Classic business style
    components.push(createComponent('text', {
      content: extractTitleFromPrompt(prompt) || 'Important Update',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1F2937',
      textAlign: 'center',
    }))
    
    components.push(createComponent('paragraph', {
      content: generateDescription(prompt, tone),
      fontSize: '16px',
      color: '#374151',
      lineHeight: '1.6',
      textAlign: 'left',
    }))
    
    components.push(createComponent('button', {
      text: 'Take Action',
      href: '#',
      backgroundColor: '#2563EB',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '4px',
      textAlign: 'center',
    }))
  }

  // Add divider if more than one component
  if (components.length > 1) {
    components.push(createComponent('divider', {
      height: '1px',
      backgroundColor: '#E5E7EB',
      margin: '30px 0',
    }))
  }

  return components
}

function generateMockSubject(request: AIGenerationRequest): string {
  const { prompt, tone, industry } = request
  
  if (tone?.toLowerCase().includes('urgent')) {
    return '🚨 Last Chance - ' + (extractTitleFromPrompt(prompt) || 'Don\'t Miss Out!')
  } else if (industry?.toLowerCase().includes('ecommerce')) {
    return '🛍️ ' + (extractTitleFromPrompt(prompt) || 'New Arrivals Just For You')
  } else if (request.style.id === 'newsletter') {
    return '📧 ' + (extractTitleFromPrompt(prompt) || 'Weekly Newsletter')
  }
  
  return extractTitleFromPrompt(prompt) || 'Important Update from Our Team'
}

function extractTitleFromPrompt(prompt: string): string | null {
  // Simple extraction logic - look for key phrases
  const keywords = ['sale', 'offer', 'announcement', 'update', 'newsletter', 'product', 'service']
  const lowerPrompt = prompt.toLowerCase()
  
  for (const keyword of keywords) {
    if (lowerPrompt.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' Alert'
    }
  }
  
  // Extract first few words as title
  const words = prompt.split(' ').slice(0, 4).join(' ')
  return words.length > 0 ? words : null
}

function generateDescription(prompt: string, tone?: string): string {
  const baseDescription = prompt.length > 100 ? 
    prompt.substring(0, 200) + '...' : 
    'We\'re excited to share this update with you. ' + prompt

  if (tone?.toLowerCase().includes('friendly')) {
    return '😊 ' + baseDescription + ' We hope you find this valuable!'
  } else if (tone?.toLowerCase().includes('professional')) {
    return baseDescription + ' Thank you for your continued partnership.'
  } else if (tone?.toLowerCase().includes('urgent')) {
    return '⚡ ' + baseDescription + ' Act fast - this won\'t last long!'
  }
  
  return baseDescription
}

function getImageForIndustry(industry?: string): string {
  if (!industry) return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop'
  
  const industryImages: { [key: string]: string } = {
    'ecommerce': 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=300&fit=crop',
    'technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
    'healthcare': 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
    'finance': 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    'education': 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop',
  }
  
  const key = Object.keys(industryImages).find(k => industry.toLowerCase().includes(k))
  return industryImages[key || 'ecommerce']
} 