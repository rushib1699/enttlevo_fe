import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ArrowLeft, Eye, Settings, Download, Sparkles } from 'lucide-react'
import { Sidebar } from '../components/EmailBuilder/Sidebar'
import { Canvas } from '../components/EmailBuilder/Canvas'
import { PropertiesPanel } from '../components/EmailBuilder/PropertiesPanel'
import { AIGenerationModal } from '../components/EmailBuilder/AIGenerationModal'
import type { EmailComponent } from '../types/email'
import { createComponent } from '../lib/email-components'
import { sampleTemplate } from '../lib/sample-template'
import { componentsToHtml, downloadHtml } from '../lib/html-export'
import { v4 as uuidv4 } from 'uuid'

export function EmailBuilder() {
  const navigate = useNavigate()
  const { campaignId } = useParams()
  const location = useLocation()
  const [components, setComponents] = useState<EmailComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [campaignTitle, setCampaignTitle] = useState('Edit Email Campaign')

  // Initialize campaign title from router state if available
  useEffect(() => {
    if (location.state?.campaignTitle) {
      setCampaignTitle(location.state.campaignTitle)
    }
  }, [location.state?.campaignTitle])

  const selectedComponentData = selectedComponent 
    ? components.find(c => c.id === selectedComponent) || null
    : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over logic if needed
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    console.log('Drag end:', { activeId: active.id, overId: over.id, activeData: active.data.current })

    // Check if we're adding a new component from sidebar to canvas
    if (over.id === 'canvas' && active.data.current?.type === 'component') {
      const componentType = active.data.current?.componentType
      if (componentType) {
        console.log('Creating new component:', componentType)
        const newComponent = createComponent(componentType)
        setComponents(prev => [...prev, newComponent])
        setSelectedComponent(newComponent.id)
      }
    } else if (active.id !== over.id) {
      // Reordering existing components
      const oldIndex = components.findIndex(c => c.id === active.id)
      const newIndex = components.findIndex(c => c.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setComponents(prev => arrayMove(prev, oldIndex, newIndex))
      }
    }
  }

  const handleUpdateComponent = (id: string, updates: Partial<EmailComponent>) => {
    setComponents(prev => 
      prev.map(component => 
        component.id === id 
          ? { ...component, ...updates }
          : component
      )
    )
  }

  const handleSelectComponent = (id: string | null) => {
    setSelectedComponent(id)
  }

  const handleDeleteComponent = (id: string) => {
    setComponents(prev => prev.filter(component => component.id !== id))
    // If the deleted component was selected, clear selection
    if (selectedComponent === id) {
      setSelectedComponent(null)
    }
  }

  const handleSave = () => {
    // Implement save functionality
    console.log('Saving email template...', { components, campaignTitle })
    alert('Email template saved successfully!')
  }

  const handlePreview = () => {
    // Implement preview functionality
    console.log('Previewing email...', { components })
  }

  const handlePublish = () => {
    // Implement publish functionality
    console.log('Publishing email...', { components, campaignTitle })
    alert('Email campaign published successfully!')
  }

  const handleAIGenerate = (generatedComponents: EmailComponent[], subject: string) => {
    setComponents(generatedComponents)
    setCampaignTitle(subject)
    setSelectedComponent(null)
  }

  const handleExportHtml = () => {
    downloadHtml(components, `${campaignTitle.replace(/\s+/g, '-').toLowerCase()}.html`)
  }

  const handlePreviewHtml = () => {
    const html = componentsToHtml(components)
    const newWindow = window.open()
    if (newWindow) {
      newWindow.document.write(html)
      newWindow.document.close()
    }
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/integrations/email-campaigns')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
            
            <div className="flex items-center space-x-2">
              <Input
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="font-semibold border-none bg-transparent p-0 focus:ring-0"
              />
              <span className="text-gray-400 text-sm">Campaign ID: {campaignId}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* <span className="text-sm text-gray-600">Ecommerce Project / Promo Product Email</span> */}
            <div className="flex items-center space-x-2 ml-4">
              <AIGenerationModal onGenerate={handleAIGenerate}>
                <Button variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate with AI
                </Button>
              </AIGenerationModal>
              
              <Button variant="outline" size="sm" onClick={handlePreviewHtml}>
                <Eye className="w-4 h-4 mr-2" />
                Preview HTML
              </Button>
              
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setComponents(sampleTemplate)}
              >
                Load Sample
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExportHtml}>
                <Download className="w-4 h-4 mr-2" />
                Export HTML
              </Button>
              
              <Button 
                onClick={handlePublish}
                className="bg-orange-500 hover:bg-orange-600"
              >
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Canvas */}
          <Canvas
            components={components}
            selectedComponent={selectedComponent}
            onSelectComponent={handleSelectComponent}
            onUpdateComponent={handleUpdateComponent}
            onDeleteComponent={handleDeleteComponent}
          />

          {/* Properties Panel */}
          <PropertiesPanel
            selectedComponent={selectedComponentData}
            onUpdateComponent={handleUpdateComponent}
          />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeId ? (
          <div className="bg-white border rounded-lg p-3 shadow-lg opacity-75">
            <span className="text-sm font-medium">
              {activeId}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
} 