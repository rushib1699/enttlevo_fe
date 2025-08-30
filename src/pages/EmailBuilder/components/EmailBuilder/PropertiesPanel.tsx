import { useState } from 'react'
import { Card } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Separator } from '../ui/separator'
import type { EmailComponent } from '../../types/email'
import { Type, Palette, Layout, Settings } from 'lucide-react'

interface PropertiesPanelProps {
  selectedComponent: EmailComponent | null
  onUpdateComponent: (id: string, updates: Partial<EmailComponent>) => void
}

export function PropertiesPanel({ selectedComponent, onUpdateComponent }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState('typography')

  if (!selectedComponent) {
    return (
      <div className="w-80 bg-white border-l flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select a component to edit its properties</p>
          </div>
        </div>
      </div>
    )
  }

  const updateContent = (key: string, value: any) => {
    onUpdateComponent(selectedComponent.id, {
      content: {
        ...selectedComponent.content,
        [key]: value,
      },
    })
  }

  const renderTypographyControls = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="font-family">Font Family</Label>
        <Select 
          value={selectedComponent.content.fontFamily || 'SF Pro'} 
          onValueChange={(value) => updateContent('fontFamily', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SF Pro">SF Pro</SelectItem>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="font-size">Font Size</Label>
        <Input
          id="font-size"
          type="number"
          value={parseInt(selectedComponent.content.fontSize || '16')}
          onChange={(e) => updateContent('fontSize', `${e.target.value}px`)}
        />
      </div>

      <div>
        <Label htmlFor="font-weight">Font Weight</Label>
        <Select 
          value={selectedComponent.content.fontWeight || 'normal'} 
          onValueChange={(value) => updateContent('fontWeight', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">Regular</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="lighter">Light</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="text-align">Text Align</Label>
        <Select 
          value={selectedComponent.content.textAlign || 'left'} 
          onValueChange={(value) => updateContent('textAlign', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="line-height">Line Height</Label>
        <Input
          id="line-height"
          type="number"
          step="0.1"
          value={parseFloat(selectedComponent.content.lineHeight || '1.5')}
          onChange={(e) => updateContent('lineHeight', e.target.value)}
        />
      </div>
    </div>
  )

  const renderBackgroundControls = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="bg-color">Background Color</Label>
        <div className="flex space-x-2">
          <Input
            id="bg-color"
            type="color"
            value={selectedComponent.content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent('backgroundColor', e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            value={selectedComponent.content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent('backgroundColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="text-color">Text Color</Label>
        <div className="flex space-x-2">
          <Input
            id="text-color"
            type="color"
            value={selectedComponent.content.color || '#000000'}
            onChange={(e) => updateContent('color', e.target.value)}
            className="w-12 h-10 p-1"
          />
          <Input
            value={selectedComponent.content.color || '#000000'}
            onChange={(e) => updateContent('color', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {selectedComponent.type === 'button' && (
        <div>
          <Label htmlFor="border-radius">Border Radius</Label>
          <Input
            id="border-radius"
            type="number"
            value={parseInt(selectedComponent.content.borderRadius || '4')}
            onChange={(e) => updateContent('borderRadius', `${e.target.value}px`)}
          />
        </div>
      )}
    </div>
  )

  const renderContentControls = () => (
    <div className="space-y-4">
      {(selectedComponent.type === 'text' || selectedComponent.type === 'paragraph') && (
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            value={selectedComponent.content.content || ''}
            onChange={(e) => updateContent('content', e.target.value)}
            rows={4}
          />
        </div>
      )}

      {selectedComponent.type === 'button' && (
        <>
          <div>
            <Label htmlFor="button-text">Button Text</Label>
            <Input
              id="button-text"
              value={selectedComponent.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="button-link">Link URL</Label>
            <Input
              id="button-link"
              value={selectedComponent.content.href || ''}
              onChange={(e) => updateContent('href', e.target.value)}
            />
          </div>
        </>
      )}

      {selectedComponent.type === 'image' && (
        <>
          <div>
            <Label htmlFor="image-src">Image URL</Label>
            <Input
              id="image-src"
              value={selectedComponent.content.src || ''}
              onChange={(e) => updateContent('src', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="image-alt">Alt Text</Label>
            <Input
              id="image-alt"
              value={selectedComponent.content.alt || ''}
              onChange={(e) => updateContent('alt', e.target.value)}
            />
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="w-80 bg-white border-l flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-gray-800">Properties</h3>
        <p className="text-sm text-gray-500 mt-1">
          {selectedComponent.type.charAt(0).toUpperCase() + selectedComponent.type.slice(1)} Component
        </p>
      </div>

      <div className="flex-1 p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="typography" className="text-xs">
              <Type className="w-3 h-3 mr-1" />
              Text
            </TabsTrigger>
            <TabsTrigger value="background" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Style
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <Layout className="w-3 h-3 mr-1" />
              Content
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <TabsContent value="typography" className="space-y-4">
              {renderTypographyControls()}
            </TabsContent>

            <TabsContent value="background" className="space-y-4">
              {renderBackgroundControls()}
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              {renderContentControls()}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 