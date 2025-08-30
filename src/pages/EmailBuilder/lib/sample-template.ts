import type { EmailComponent } from '../types/email'
import { v4 as uuidv4 } from 'uuid'

export const sampleTemplate: EmailComponent[] = [
  {
    id: uuidv4(),
    type: 'text',
    content: {
      content: 'ENTTLEVO',
      fontSize: '18px',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    },
    styles: {},
    children: []
  },
  {
    id: uuidv4(),
    type: 'text',
    content: {
      content: 'Here we go, Summer Sale This Year!!',
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'center',
    },
    styles: {},
    children: []
  },
  {
    id: uuidv4(),
    type: 'image',
    content: {
      src: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      alt: 'MacBook Pro',
      width: '100%',
      height: 'auto',
    },
    styles: {},
    children: []
  },
  {
    id: uuidv4(),
    type: 'paragraph',
    content: {
      content: 'Are you ready to take your productivity to the next level? We\'re excited to introduce the latest MacBook Pro, designed to help you work smarter, create faster, and achieve more than ever before.',
      fontSize: '16px',
      color: '#333333',
      lineHeight: '1.6',
      textAlign: 'center',
    },
    styles: {},
    children: []
  },
  {
    id: uuidv4(),
    type: 'button',
    content: {
      text: 'Go To Shop',
      href: '#',
      backgroundColor: '#D97706',
      color: '#ffffff',
      padding: '12px 24px',
      borderRadius: '6px',
      textAlign: 'center',
    },
    styles: {},
    children: []
  },
  {
    id: uuidv4(),
    type: 'divider',
    content: {
      height: '1px',
      backgroundColor: '#e5e7eb',
      margin: '40px 0',
    },
    styles: {},
    children: []
  },
  {
    id: uuidv4(),
    type: 'paragraph',
    content: {
      content: 'Exclusive Offer: Just for You! Premium Electronics at Unbeatable Prices.',
      fontSize: '18px',
      color: '#374151',
      lineHeight: '1.5',
      textAlign: 'center',
      fontWeight: 'bold',
    },
    styles: {},
    children: []
  }
] 