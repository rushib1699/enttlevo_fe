import { useMemo, useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCorners,
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
  useDroppable,
  DragOverlay,
  Active,
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { DealsData } from '@/types';
import { updateInlineDropdown } from '@/api';
import { useNavigate } from 'react-router-dom';
import { CSS } from '@dnd-kit/utilities';
import { User, Briefcase, Calendar, Building2, Globe, Mail, MapPin, Lock, Search } from 'lucide-react';
import { toast } from "sonner";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from '@/components/ui/input';

// KanbanCard component definition
const KanbanCard = ({ deal, id }: { deal: DealsData; id: string }) => {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: id,
    data: {
      type: 'card',
      deal
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isHovering ? 10 : 'auto'
  };
  
  const handleClick = () => {
    navigate(`/sales/account/${deal.id}`);
  };

  const cardHoverContent = (
    <div className="max-w-xs">
      <h4 className="font-bold mb-2 text-blue-600">{deal.account_name}</h4>
      
      <div className="space-y-2 text-xs">
        {deal.contact_name && (
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div>
              <div className="font-semibold">Contact</div>
              <div>{deal.contact_name}</div>
            </div>
          </div>
        )}
        
        {deal.mib > 0 && (
          <div className="flex items-start gap-2">
            <Briefcase className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div>
              <div className="font-semibold">Revenue</div>
              <div>${deal.mib.toLocaleString()}</div>
            </div>
          </div>
        )}

        {deal.industry && (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div>
              <div className="font-semibold">Industry</div>
              <div>{deal.industry}</div>
            </div>
          </div>
        )}
        
        {deal.email && (
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="font-semibold">Email</div>
              <div className="truncate">{deal.email}</div>
            </div>
          </div>
        )}
        
        {deal.website && (
          <div className="flex items-start gap-2">
            <Globe className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="font-semibold">Website</div>
              <div className="truncate">{deal.website}</div>
            </div>
          </div>
        )}

        {deal.address && (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <div className="font-semibold">Address</div>
              <div className="truncate">{deal.address}</div>
              {deal.city && <div className="truncate">{deal.city}, {deal.state} {deal.country}</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
  
  const isSentToOB = deal.sent_to_ob === 1;
  
  return (
    <HoverCard openDelay={500}>
      <HoverCardTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...attributes}
          {...listeners}
          className={`p-3 bg-white rounded-md shadow mb-2 cursor-grab hover:shadow-md transition-shadow ${
            isSentToOB ? 'bg-gray-50 border border-orange-200' : ''
          }`}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div onClick={handleClick} className="cursor-pointer">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className={`${isSentToOB ? 'text-orange-500' : 'text-blue-500'} flex-shrink-0`}>
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className={`font-bold text-sm truncate ${
                    isSentToOB ? 'text-gray-600' : 'hover:text-blue-600'
                  }`} title={deal.account_name}>
                    {deal.account_name}
                  </h4>
                  {deal.contact_name && (
                    <p className="text-xs text-gray-500 truncate" title={deal.contact_name}>
                      {deal.contact_name}
                    </p>
                  )}
                </div>
              </div>
              {isSentToOB && (
                <span className="text-orange-500 flex-shrink-0" title="Sent to Onboarding">
                  <Lock className="h-4 w-4" />
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {deal.mib > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Briefcase className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Revenue: ${deal.mib.toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-600">
                <User className="h-4 w-4 flex-shrink-0" />
                <span className="truncate" title={deal.lead_owner || 'Unassigned'}>
                  {deal.lead_owner || 'Unassigned'}
                </span>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>{deal.created_at}</span>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                {isSentToOB && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                    In Onboarding
                  </span>
                )}
                <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 whitespace-nowrap ${
                  deal.status === 'Hot' ? 'bg-red-100 text-red-700' :
                  deal.status === 'Warm' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${
                    deal.status === 'Hot' ? 'bg-red-500' :
                    deal.status === 'Warm' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}></span>
                  {deal.status || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        {cardHoverContent}
      </HoverCardContent>
    </HoverCard>
  );
};

// CardContainer component to render the card in drag overlay
const CardContainer = ({ deal }: { deal: DealsData }) => {
  const isSentToOB = deal.sent_to_ob === 1;

  return (
    <div className={`p-3 bg-white rounded-md shadow mb-2 cursor-grabbing w-[280px] ${
      isSentToOB ? 'bg-gray-50 border border-orange-200' : ''
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <span className={`${isSentToOB ? 'text-orange-500' : 'text-blue-500'}`}>
            <Building2 className="h-5 w-5" />
          </span>
          <h4 className={`font-bold text-sm truncate ${
            isSentToOB ? 'text-gray-600' : ''
          }`}>
            {deal.account_name}
          </h4>
        </div>
        {isSentToOB && (
          <span className="text-orange-500" title="Sent to Onboarding">
            <Lock className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-2 text-xs text-gray-600">
        {deal.mib > 0 && (
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>Revenue: ${deal.mib.toLocaleString()}</span>
          </div>
        )}

        {deal.industry && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{deal.industry}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// KanbanColumn component - Modified to make the entire column droppable
const KanbanColumn = ({ 
  title, 
  deals, 
  id 
}: { 
  title: string; 
  deals: DealsData[]; 
  id: string 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const lockedDeals = deals.filter(deal => deal.sent_to_ob === 1);
  const activeDeals = deals.filter(deal => deal.sent_to_ob !== 1);

  return (
    <div 
      ref={setNodeRef} 
      className={`flex flex-col min-w-[280px] max-w-[280px] mx-2 ${
        isOver ? 'ring-2 ring-blue-300' : ''
      }`}
    >
      <div className={`p-2 bg-gray-200 rounded-t-md ${
        isOver ? 'bg-blue-100' : ''
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">{title}</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                {activeDeals.length}
              </span>
              {lockedDeals.length > 0 && (
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {lockedDeals.length}
                </span>
              )}
            </div>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
              ARR: ${deals.reduce((sum, deal) => sum + (deal.proposed_arr || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      <div 
        className={`p-2 flex-1 overflow-y-auto max-h-[calc(70vh-3rem)] min-h-[200px] rounded-b-md ${
          isOver ? 'bg-blue-50' : 'bg-gray-50'
        }`}
      >
        {deals.map(deal => (
          <KanbanCard 
            key={deal.id} 
            deal={deal} 
            id={deal.id.toString()} 
          />
        ))}
        {deals.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            Drag deals here
          </div>
        )}
      </div>
    </div>
  );
};

interface DealsKanbanBoardProps {
  data: DealsData[];
  contractStages: { id: number; stage: string; is_active?: number }[];
  onRefresh: () => void;
  userId: string | number;
  companyId: string | number;
}

const DealsKanbanBoard = ({ 
  data, 
  contractStages, 
  onRefresh, 
  userId,
  companyId
}: DealsKanbanBoardProps) => {
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<DealsData | null>(null);
  const [localDeals, setLocalDeals] = useState<DealsData[]>(data);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLocalDeals(data);
  }, [data]);

  // Filter out inactive contract stages and show only the last 4 stages
  const activeContractStages = useMemo(() => {
    return contractStages.filter((stage, index) => 
      (index >= 4) && (stage.is_active === undefined || stage.is_active === 1)
    );
  }, [contractStages]);

  // Add this function to filter deals
  const filteredDeals = useMemo(() => {
    if (!searchQuery.trim()) return localDeals;
    
    return localDeals.filter(deal => 
      deal.account_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [localDeals, searchQuery]);

  // Update the groupedDeals to use filteredDeals instead of localDeals
  const groupedDeals = useMemo(() => {
    const grouped: Record<string, DealsData[]> = {};
    
    activeContractStages.forEach(stage => {
      grouped[stage.stage] = [];
    });
    
    filteredDeals.forEach(deal => {
      if (!grouped[deal.contract_stage]) {
        grouped[deal.contract_stage] = [];
      }
    });
    
    filteredDeals.forEach(deal => {
      if (grouped[deal.contract_stage]) {
        grouped[deal.contract_stage].push(deal);
      }
    });
    
    return grouped;
  }, [filteredDeals, activeContractStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: { active: Active }) => {
    const { active } = event;
    setActiveId(active.id.toString());
    
    const deal = localDeals.find(d => d.id.toString() === active.id.toString());
    if (deal) {
      setActiveDeal(deal);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveDeal(null);
    
    if (!over) return;
    
    // Extract the deal ID from the draggable's ID
    const dealId = active.id.toString();
    
    // Find the deal that was dragged
    const deal = localDeals.find(d => d.id.toString() === dealId);
    if (!deal) return;
    
    // Prevent dragging if the deal is sent to onboarding
    if (deal.sent_to_ob === 1) {
      toast.error("This deal is locked as it has been sent to onboarding.");
      return;
    }

    // Check if the target is a card or a column
    let targetStage = over.id.toString();
    
    // If we dropped on a card, find its parent column/stage
    const isTargetACard = localDeals.some(d => d.id.toString() === targetStage);
    if (isTargetACard) {
      // Get the target stage from the card's contract_stage
      const targetCard = localDeals.find(d => d.id.toString() === targetStage);
      if (!targetCard) return;
      targetStage = targetCard.contract_stage;
    }
    
    // Don't do anything if we're dropping in the same stage
    if (deal.contract_stage === targetStage) return;
    
    // Find the contract stage ID from the contract stage name
    const contractStageObj = activeContractStages.find(stage => stage.stage === targetStage);
    
    if (!contractStageObj) {
      toast.error(`Invalid contract stage: ${targetStage}`);
      return;
    }
    
    // Update local state first for immediate UI feedback
    setLocalDeals(prevDeals => 
      prevDeals.map(d => 
        d.id.toString() === dealId 
          ? { ...d, contract_stage: targetStage } 
          : d
      )
    );
    
    // Show optimistic success message
    toast.loading(`Moving "${deal.account_name}" to ${targetStage}...`);
    
    try {
      setLoading(true);
      
      // Prepare the payload for the API call
      const payload = {
        col_name: 'contract_stage_id',
        value: contractStageObj.id,
        user_id: Number(userId),
        company_id: Number(companyId),
        lead_id: deal.id,
      };
       
      await updateInlineDropdown(payload);
      toast.success(`Deal "${deal.account_name}" moved to ${targetStage}`);
      
      // Don't call onRefresh() here since we've already updated the UI
      // Only refresh in case of error to ensure data consistency
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast.error('Failed to update deal stage. Refreshing data...');
      
      // Only refresh the entire board if there was an error to ensure data consistency
      onRefresh();
    } finally {
      setLoading(false);
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setActiveDeal(null);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-white border-b flex justify-start items-start">
        <div className="relative w-[600px]"> {/* Added fixed width */}
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search deals by company, contact, or email..."
            className="pl-9 pr-4 w-full min-w-[400px]" // Added min-width to ensure consistent size
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="flex overflow-x-auto pb-4 pt-2 min-h-[calc(80vh-4rem)] bg-gray-100">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {Object.entries(groupedDeals).map(([stage, deals]) => (
            <SortableContext
              key={stage}
              items={deals.map(deal => deal.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <KanbanColumn 
                title={stage} 
                deals={deals} 
                id={stage} 
              />
            </SortableContext>
          ))}

          <DragOverlay>
            {activeId && activeDeal ? (
              <CardContainer deal={activeDeal} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default DealsKanbanBoard;