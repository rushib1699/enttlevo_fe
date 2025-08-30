import type { ComponentDefinition } from '../types/email'
import { v4 as uuidv4 } from 'uuid'

export const EMAIL_COMPONENTS: ComponentDefinition[] = [
  {
    type: 'text',
    label: 'Text Title',
    icon: 'Type',
    defaultProps: {
      content: 'Your Title Here',
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    }
  },
  {
    type: 'paragraph',
    label: 'Text Description',
    icon: 'AlignLeft',
    defaultProps: {
      content: 'Your description text goes here. This is a sample paragraph that you can edit.',
      fontSize: '16px',
      color: '#333333',
      lineHeight: '1.5',
    }
  },
  {
    type: 'image',
    label: 'Image Product',
    icon: 'Image',
    defaultProps: {
      src: 'https://via.placeholder.com/400x300',
      alt: 'Product Image',
      width: '100%',
      height: 'auto',
    }
  },
  {
    type: 'button',
    label: 'CTA',
    icon: 'MousePointer',
    defaultProps: {
      text: 'Click Here',
      href: '#',
      backgroundColor: '#ff6b35',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '4px',
      textAlign: 'center',
    }
  },
  {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    defaultProps: {
      height: '1px',
      backgroundColor: '#e5e7eb',
      margin: '20px 0',
    }
  }
]

export const LAYOUT_COMPONENTS: ComponentDefinition[] = [
  {
    type: 'section',
    label: 'Section',
    icon: 'Square',
    defaultProps: {
      backgroundColor: '#ffffff',
      padding: '20px',
    }
  },
  {
    type: 'container',
    label: 'Container',
    icon: 'Box',
    defaultProps: {
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px',
    }
  },
  {
    type: 'columns',
    label: 'Columns',
    icon: 'Columns',
    defaultProps: {
      columnCount: 2,
      gap: '20px',
    }
  }
]

export function createComponent(type: string, props?: any) {
  const definition = [...EMAIL_COMPONENTS, ...LAYOUT_COMPONENTS].find(c => c.type === type)
  if (!definition) throw new Error(`Unknown component type: ${type}`)
  
  return {
    id: uuidv4(),
    type,
    content: props || definition.defaultProps,
    styles: {},
    children: []
  }
} 