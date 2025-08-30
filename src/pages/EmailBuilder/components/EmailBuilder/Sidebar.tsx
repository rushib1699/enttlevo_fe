import { useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { ScrollArea } from '../ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible'
import { ChevronDown, ChevronRight, Type, AlignLeft, Image, MousePointer, Minus, Square, Box, Columns } from 'lucide-react'
import { EMAIL_COMPONENTS, LAYOUT_COMPONENTS } from '../../lib/email-components'
import type { ComponentDefinition } from '../../types/email'

interface DraggableItemProps {
  component: ComponentDefinition
}

function DraggableItem({ component }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${component.type}`,
    data: {
      type: 'component',
      componentType: component.type,
    },
  })

  const getIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ComponentType<any> } = {
      Type,
      AlignLeft,
      Image,
      MousePointer,
      Minus,
      Square,
      Box,
      Columns,
    }
    return iconMap[iconName] || Box
  }

  const IconComponent = getIcon(component.icon)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center space-x-3 p-3 rounded-lg border bg-white cursor-grab hover:bg-gray-50 transition-colors ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <IconComponent className="w-4 h-4 text-gray-600" />
      <span className="text-sm font-medium">{component.label}</span>
    </div>
  )
}

interface SidebarSectionProps {
  title: string
  components: ComponentDefinition[]
  defaultOpen?: boolean
}

function SidebarSection({ title, components, defaultOpen = true }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 rounded-lg">
        <span className="font-medium text-gray-700">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 mt-2">
        {components.map((component) => (
          <DraggableItem key={component.type} component={component} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  )
}

export function Sidebar() {
  return (
    <div className="w-72 bg-gray-50 border-r flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-gray-800">Pages</h2>
        <div className="mt-2 space-y-1">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>📧</span>
            <span>Email Campaign</span>
          </div>
        </div>
      </div>

      {/* Components */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <SidebarSection title="Email Components" components={EMAIL_COMPONENTS} />
          <SidebarSection title="Layouts" components={LAYOUT_COMPONENTS} />
        </div>
      </ScrollArea>
    </div>
  )
}