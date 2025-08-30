export interface EmailComponent {
  id: string
  type: string
  content: any
  styles: Record<string, string>
  children?: EmailComponent[]
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  components: EmailComponent[]
  settings: EmailSettings
}

export interface EmailSettings {
  backgroundColor: string
  padding: string
  fontFamily: string
  fontSize: string
  lineHeight: string
}

export interface Campaign {
  id: string
  title: string
  subject: string
  publishDate: string
  opened: number
  clicked: number
  bounceOff: number
  status: 'draft' | 'active' | 'paused'
  template?: EmailTemplate
}

export interface ComponentDefinition {
  type: string
  label: string
  icon: string
  defaultProps: any
}

export interface DragItem {
  type: string
  componentType: string
  id?: string
} 