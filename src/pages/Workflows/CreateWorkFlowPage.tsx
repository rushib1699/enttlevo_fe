import React, { useState } from 'react'
import { WorkflowCanvas } from './WorkflowBuilder/components/Canvas/WorkflowCanvas'
import { Element } from '@/types'

const CreateWorkFlowPage = () => {
  const [elements, setElements] = useState<Element[]>([])
  return (
    <div>
      <WorkflowCanvas elements={elements} setElements={setElements} />
    </div>
  )
}

export default CreateWorkFlowPage