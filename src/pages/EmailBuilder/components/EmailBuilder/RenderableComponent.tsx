import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { EmailComponent } from '../../types/email'
import { Trash2, Move } from 'lucide-react'

interface RenderableComponentProps {
  component: EmailComponent
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<EmailComponent>) => void
  onDelete: () => void
}

export function RenderableComponent({ 
  component, 
  isSelected, 
  onSelect,
  onUpdate,
  onDelete 
}: RenderableComponentProps) {
  const [isEditing, setIsEditing] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleContentChange = (newContent: string) => {
    onUpdate({
      content: {
        ...component.content,
        content: newContent,
      },
    })
  }
  
  const renderComponent = () => {
    const { content } = component

    switch (component.type) {
      case 'text':
        return (
          <div 
            style={{
              fontSize: content.fontSize,
              fontWeight: content.fontWeight,
              color: content.color,
              textAlign: content.textAlign,
            }}
            className={isEditing ? 'outline-2 outline-blue-500' : ''}
            contentEditable={isEditing}
            onBlur={(e) => {
              handleContentChange(e.currentTarget.textContent || '')
              setIsEditing(false)
            }}
            onDoubleClick={() => setIsEditing(true)}
            suppressContentEditableWarning={true}
          >
            {content.content}
          </div>
        )

      case 'paragraph':
        return (
          <p 
            style={{
              fontSize: content.fontSize,
              color: content.color,
              lineHeight: content.lineHeight,
            }}
            className={isEditing ? 'outline-2 outline-blue-500' : ''}
            contentEditable={isEditing}
            onBlur={(e) => {
              handleContentChange(e.currentTarget.textContent || '')
              setIsEditing(false)
            }}
            onDoubleClick={() => setIsEditing(true)}
            suppressContentEditableWarning={true}
          >
            {content.content}
          </p>
        )

      case 'image':
        return (
          <div className="text-center">
            <img 
              src={content.src}
              alt={content.alt}
              style={{
                width: content.width,
                height: content.height,
                maxWidth: '100%',
                borderRadius: '8px',
              }}
              className="mx-auto"
            />
          </div>
        )

      case 'button':
        return (
          <div className="text-center">
            <a
              href={content.href}
              style={{
                backgroundColor: content.backgroundColor,
                color: content.color,
                padding: content.padding,
                borderRadius: content.borderRadius,
                textDecoration: 'none',
                display: 'inline-block',
                fontSize: '16px',
                fontWeight: '500',
              }}
              className={isEditing ? 'outline-2 outline-blue-500' : ''}
              contentEditable={isEditing}
              onBlur={(e) => {
                handleContentChange(e.currentTarget.textContent || '')
                setIsEditing(false)
              }}
              onDoubleClick={() => setIsEditing(true)}
              suppressContentEditableWarning={true}
            >
              {content.text}
            </a>
          </div>
        )

      case 'divider':
        return (
          <div 
            style={{
              height: content.height,
              backgroundColor: content.backgroundColor,
              margin: content.margin,
            }}
          />
        )

      case 'section':
        return (
          <div 
            style={{
              backgroundColor: content.backgroundColor,
              padding: content.padding,
            }}
            className="w-full"
          >
            {component.children?.map((child) => (
              <RenderableComponent
                key={child.id}
                component={child}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )

      case 'container':
        return (
          <div 
            style={{
              maxWidth: content.maxWidth,
              margin: content.margin,
              padding: content.padding,
            }}
            className="w-full"
          >
            {component.children?.map((child) => (
              <RenderableComponent
                key={child.id}
                component={child}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            ))}
          </div>
        )

      default:
        return <div>Unknown component type: {component.type}</div>
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      } ${isDragging ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      {/* Component Content */}
      <div className="relative">
        {renderComponent()}
      </div>

      {/* Selection Overlay */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 rounded-lg">
          <div className="absolute -top-8 left-0 flex items-center space-x-1">
            <button
              {...attributes}
              {...listeners}
              className="p-1 bg-blue-500 text-white rounded text-xs pointer-events-auto cursor-grab active:cursor-grabbing"
            >
              <Move className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="p-1 bg-red-500 text-white rounded text-xs pointer-events-auto"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 