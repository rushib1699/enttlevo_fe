import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Plus, Settings, Eye, MoreHorizontal } from 'lucide-react'
import type { Campaign } from '../types/email'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid'

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Unlock Your Potential',
    subject: 'Upgrade Your Life: Latest Tech Gadgets for 2024!',
    publishDate: '2024-01-12',
    opened: 1232,
    clicked: 324,
    bounceOff: 12,
    status: 'draft'
  },
  {
    id: '2',
    title: 'Elevate Your Life',
    subject: 'Power Up Your Home: Exclusive Deals on Smart Electronics!',
    publishDate: '2024-02-05',
    opened: 23,
    clicked: 12,
    bounceOff: 12,
    status: 'draft'
  },
  {
    id: '3',
    title: 'Premium Audio',
    subject: 'Next-Level Entertainment: Ultra HD TVs at Unbeatable Prices!',
    publishDate: '2024-03-10',
    opened: 44,
    clicked: 43,
    bounceOff: 12,
    status: 'draft'
  },
  {
    id: '4',
    title: 'Stay Connected',
    subject: 'Stay Connected: Best Deals on Laptops and Smartphones!',
    publishDate: '2024-04-22',
    opened: 64,
    clicked: 45,
    bounceOff: 12,
    status: 'active'
  },
  {
    id: '5',
    title: 'Tech That Empowers',
    subject: 'Experience the Future: Innovative Electronics for Everyday Use!',
    publishDate: '2024-06-11',
    opened: 764,
    clicked: 232,
    bounceOff: 12,
    status: 'active'
  }
]

export function CampaignManager() {
  const navigate = useNavigate()
  const [campaigns] = useState<Campaign[]>(mockCampaigns)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newCampaignTitle, setNewCampaignTitle] = useState('')

  const handleCreateCampaign = () => {
    if (newCampaignTitle.trim()) {
      const campaignId = uuidv4()
      // Navigate to builder with the campaign ID and title
      navigate(`/builder/${campaignId}`, { 
        state: { 
          campaignId,
          campaignTitle: newCampaignTitle.trim() 
        } 
      })
      setIsCreateModalOpen(false)
      setNewCampaignTitle('')
    }
  }

  const handleModalClose = () => {
    setIsCreateModalOpen(false)
    setNewCampaignTitle('')
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      paused: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]} className="capitalize">
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d - MMM d, yyyy')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold">Enttlevo</span>
              <span className="text-gray-500">Campaign</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">Email</h1>
              <Badge variant="secondary">All Email</Badge>
              <Badge variant="outline">Active</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View Settings
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Manage Table
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Publish Date</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Clicked</TableHead>
                  <TableHead>Bounce Off</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell className="font-medium">{campaign.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{campaign.subject}</TableCell>
                    <TableCell>{formatDate(campaign.publishDate)}</TableCell>
                    <TableCell>{campaign.opened.toLocaleString()}</TableCell>
                    <TableCell>{campaign.clicked}</TableCell>
                    <TableCell>{campaign.bounceOff}</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/builder/${campaign.id}`)}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>
              Enter a name for your new email campaign to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-title">Campaign Title</Label>
              <Input
                id="campaign-title"
                placeholder="Enter campaign title..."
                value={newCampaignTitle}
                onChange={(e) => setNewCampaignTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCampaignTitle.trim()) {
                    handleCreateCampaign()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleModalClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateCampaign}
              disabled={!newCampaignTitle.trim()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Start Building
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 