import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { EmailComponent } from '../../types/email'
import { RenderableComponent } from './RenderableComponent'

interface CanvasProps {
  components: EmailComponent[]
  selectedComponent: string | null
  onSelectComponent: (id: string | null) => void
  onUpdateComponent: (id: string, updates: Partial<EmailComponent>) => void
  onDeleteComponent: (id: string) => void
}

export function Canvas({ 
  components, 
  selectedComponent, 
  onSelectComponent,
  onUpdateComponent,
  onDeleteComponent 
}: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  })

  return (
    <div className="flex-1 bg-gray-100 p-8 overflow-auto">
      <div className="max-w-2xl mx-auto">
        {/* Email Preview Container */}
        <div 
          ref={setNodeRef}
          className={`bg-white border-2 border-dashed rounded-lg min-h-96 transition-colors ${
            isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
          }`}
        >
          {components.length === 0 ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-4">📧</div>
                <div className="text-lg font-medium mb-2">Start Building Your Email</div>
                <div className="text-sm">Drag components from the sidebar to get started</div>
              </div>
            </div>
          ) : (
            <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="p-4 space-y-4 min-h-96">
                {components.map((component) => (
                  <RenderableComponent
                    key={component.id}
                    component={component}
                    isSelected={selectedComponent === component.id}
                    onSelect={() => onSelectComponent(component.id)}
                    onUpdate={(updates) => onUpdateComponent(component.id, updates)}
                    onDelete={() => onDeleteComponent(component.id)}
                  />
                ))}
                {/* Empty drop zone at the end */}
                <div className="h-20 border-2 border-dashed border-transparent rounded-lg transition-colors hover:border-gray-300">
                  {/* This provides additional drop space */}
                </div>
              </div>
            </SortableContext>
          )}
        </div>

        {/* Email Actions */}
        {/* <div className="mt-4 flex justify-center space-x-2">
          <button className="p-2 bg-white border rounded-lg hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 8L12 13L3 8V6L12 11L21 6V8Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="p-2 bg-white border rounded-lg hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V10C2 16 6 20.5 12 22C18 20.5 22 16 22 10V7L12 2Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="p-2 bg-white border rounded-lg hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor"/>
            </svg>
          </button>
          <button className="p-2 bg-white border rounded-lg hover:bg-gray-50">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="currentColor"/>
            </svg>
          </button>
          <div className="flex items-center space-x-2 px-3 py-2 bg-white border rounded-lg">
            <span className="text-sm">100%</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div> */}
      </div>
    </div>
  )
} 