import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNotesByLeads, createNoteByCompanyId } from '@/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  StickyNote, 
  Plus, 
  Save, 
  Calendar,
  User,
  Grid,
  List,
  Loader2,
  X,
  CalendarIcon,
  SaveIcon
} from "lucide-react";

interface Note {
  id: number;
  note: string;
  created_by: string;
  created_at: string;
}

interface NotesTabProps {
  accountId?: string;
  userId?: string;
  isLeadInOnboarding?: boolean;
}

const SalesNotesTab: React.FC<NotesTabProps> = ({ accountId, userId, isLeadInOnboarding }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    note: ''
  });

  useEffect(() => {
    fetchNotes();
  }, [accountId]);

  const fetchNotes = async () => {
    if (!accountId) return;
    
    setIsLoading(true);
    try {
      const response = await getNotesByLeads({ leads_id: Number(accountId) });
      setNotes(response || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = () => {
    setFormData({ note: '' });
    setIsDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!accountId || !formData.note.trim()) return;

    setIsSaving(true);
    try {
      await createNoteByCompanyId({
        company_id: Number(accountId),
        note: formData.note,
        user_id: userId,
        leads_id: Number(accountId)
      });
      await fetchNotes();
      setIsDialogOpen(false);
      setFormData({ note: '' });
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <Card key={note.id} className="hover:shadow-md transition-shadow rounded-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-gray-600 text-sm leading-relaxed">{note.note}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {note.created_by}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(note.created_at)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderTableView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Note</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notes.map((note) => (
          <TableRow key={note.id}>
            <TableCell className="font-medium">{note.note}</TableCell>
            <TableCell>{note.created_by}</TableCell>
            <TableCell>{formatDate(note.created_at)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid className={`h-4 w-4 ${viewMode === 'grid' ? 'text-blue-600' : 'text-gray-500'}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm" 
            className="h-8"
            onClick={() => setViewMode('table')}
          >
            <List className={`h-4 w-4 ${viewMode === 'table' ? 'text-blue-600' : 'text-gray-500'}`} />
          </Button>
          <Button
            onClick={handleAddNote}
            size="sm"
            variant="default"
            disabled={isLeadInOnboarding}
          >
            <Plus className="h-4 w-4" />
            Note
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl p-4 ">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
            <DialogDescription>
              Create a new note to keep track of important information
            </DialogDescription>
          </DialogHeader>
          <div className="">
            <textarea
              value={formData.note}
              onChange={(e) => setFormData({ note: e.target.value })}
              placeholder="Type your note here..."
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] text-sm"
              maxLength={500}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.note.length} / 500
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="px-4"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={isSaving || !formData.note.trim() || !isLeadInOnboarding}
              variant="default"
              className="px-4"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Note...
                </>
              ) : (
                <>
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Create Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : notes.length > 0 ? (
          viewMode === 'grid' ? renderGridView() : renderTableView()
        ) : (
          <div className="text-center py-12">
            <StickyNote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No notes added yet</p>
            <Button
              onClick={handleAddNote}
              variant="outline"
              className="inline-flex items-center"
              disabled={isLeadInOnboarding}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Note
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesNotesTab;