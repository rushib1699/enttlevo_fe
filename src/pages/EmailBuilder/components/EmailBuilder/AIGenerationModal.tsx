import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, Sparkles, Wand2 } from 'lucide-react'
import { EMAIL_STYLES, AI_MODELS, type EmailStyle, type AIModel, type AIGenerationRequest } from '../../types/ai'
import type { EmailComponent } from '../../types/email'

interface AIGenerationModalProps {
  onGenerate: (components: EmailComponent[], subject: string) => void
  children: React.ReactNode
}

export function AIGenerationModal({ onGenerate, children }: AIGenerationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<EmailStyle>(EMAIL_STYLES[0])
  const [selectedModel, setSelectedModel] = useState<AIModel>(AI_MODELS[0])
  const [tone, setTone] = useState('')
  const [industry, setIndustry] = useState('')
  const [targetAudience, setTargetAudience] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    
    try {
      const request: AIGenerationRequest = {
        prompt: prompt.trim(),
        style: selectedStyle,
        model: selectedModel,
        tone: tone || undefined,
        industry: industry || undefined,
        targetAudience: targetAudience || undefined,
      }

      // Call the real AI API
      const response = await fetch('http://localhost:3001/api/email/template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      const data = await response.json()

      if (data.success && data.template) {
        onGenerate(data.template.components, data.template.subject)
        setIsOpen(false)
        resetForm()
      } else {
        throw new Error(data.error || 'Failed to generate email')
      }
    } catch (error) {
      console.error('AI Generation Error:', error)
      alert('Failed to generate email. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setPrompt('')
    setTone('')
    setIndustry('')
    setTargetAudience('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[1200px] max-h-[100vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generate Email with AI
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Prompt and Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <Label htmlFor="prompt">Email Description *</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the email you want to create. For example: 'A promotional email for our summer sale featuring 50% off electronics with a modern, vibrant design...'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={10}
                className="mt-2 h-[400px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tone">Tone (Optional)</Label>
                <Input
                  id="tone"
                  placeholder="e.g., Professional, Friendly, Urgent"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="industry">Industry (Optional)</Label>
                <Input
                  id="industry"
                  placeholder="e.g., E-commerce, SaaS, Healthcare"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="audience">Target Audience (Optional)</Label>
                <Input
                  id="audience"
                  placeholder="e.g., Young adults, Business owners"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Style and Model Selection */}
          <div className="space-y-6">
            <div>
              <Label>Email Style</Label>
              <div className="mt-2 space-y-2">
                {EMAIL_STYLES.map((style) => (
                  <Card
                    key={style.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedStyle.id === style.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedStyle(style)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{style.name}</div>
                        <div className="text-sm text-gray-500">{style.description}</div>
                      </div>
                      {selectedStyle.id === style.id && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label>AI Model</Label>
              <Select
                value={selectedModel.id}
                onValueChange={(value) => {
                  const model = AI_MODELS.find(m => m.id === value)
                  if (model) setSelectedModel(model)
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div className="font-medium">{model.name}</div>
                        {/* <div className="text-sm text-gray-500">{model.description}</div> */}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 