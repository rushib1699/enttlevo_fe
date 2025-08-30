import React, { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Image,
  FileType,
  Download,
  Eye, 
  Grid3X3,
  List,
  Plus,
  Loader2,
  X,
  Calendar
} from "lucide-react";
import { getDocumentsByLeadId, uploadDocumentSales } from "@/api";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { DocumentList } from "@/types";
import { saveAs } from "file-saver";
import { useUserPermission } from "@/context/UserPermissionContext";
import moment from 'moment';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DocumentViewerDialog } from "./DocumentViewerDialog";

// Types
interface DocumentsProps {
  accountId?: string;
  isLeadInOnboarding?: boolean;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

// Document type configuration
const DOCUMENT_TYPES = {
  pdf: {
    icon: FileText,
    color: 'bg-red-100 text-red-700',
    label: 'PDF Document',
    type: 'pdf'
  },
  doc: {
    icon: FileType,
    color: 'bg-blue-100 text-blue-700',
    label: 'Word Document',
    type: 'document'
  },
  docx: {
    icon: FileType,
    color: 'bg-blue-100 text-blue-700',
    label: 'Word Document',
    type: 'document'
  },
  xls: {
    icon: FileType,
    color: 'bg-green-100 text-green-700',
    label: 'Excel Spreadsheet',
    type: 'document'
  },
  xlsx: {
    icon: FileType,
    color: 'bg-green-100 text-green-700',
    label: 'Excel Spreadsheet',
    type: 'document'
  },
  jpg: {
    icon: Image,
    color: 'bg-purple-100 text-purple-700',
    label: 'Image',
    type: 'image'
  },
  jpeg: {
    icon: Image,
    color: 'bg-purple-100 text-purple-700',
    label: 'Image',
    type: 'image'
  },
  png: {
    icon: Image,
    color: 'bg-purple-100 text-purple-700',
    label: 'Image',
    type: 'image'
  }
};

const SalesDocumnets: React.FC<DocumentsProps> = ({ accountId, isLeadInOnboarding }) => {
  // State
  const [documents, setDocuments] = useState<DocumentList>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string; type: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Hooks
  const { loginResponse } = useApplicationContext();
  const { hasAccess } = useUserPermission();
  const hasWritePermission = hasAccess('write');
  const isSuperAdmin = hasAccess("superadmin");
  const canUpload = hasWritePermission || isSuperAdmin;

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      const response = await getDocumentsByLeadId({
        lead_id: Number(accountId),
      });
      setDocuments(response);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // File handling functions
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).map((file) => ({
      file,
      progress: 0,
      status: 'uploading' as const,
    }));
    setUploadFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleFileRemove = useCallback((file: UploadFile) => {
    setUploadFiles(prev => prev.filter(f => f.file !== file.file));
  }, []);

  const handleUpload = useCallback(async () => {
    if (!uploadFiles.length) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      await Promise.all(
        uploadFiles.map(async (uploadFile) => {
          try {
            const response = await uploadDocumentSales({
              file: uploadFile.file,
              lead_id: Number(accountId),
              user_id: Number(loginResponse?.id),
            });

            if (response) {
              setUploadFiles(prev => prev.map(f => 
                f.file === uploadFile.file 
                  ? { ...f, progress: 100, status: 'done' }
                  : f
              ));
              successCount++;
            }
          } catch (error) {
            console.error("Upload error:", error);
            setUploadFiles(prev => prev.map(f => 
              f.file === uploadFile.file 
                ? { ...f, status: 'error' }
                : f
            ));
            failCount++;
          }
        })
      );

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}`);
        await fetchDocuments();
        
        if (failCount === 0) {
          setTimeout(() => {
            setUploadModalVisible(false);
            setUploadFiles([]);
          }, 500);
        }
      }

      if (failCount > 0) {
        toast.error(`Failed to upload ${failCount} file${failCount > 1 ? 's' : ''}`);
      }
    } finally {
      setUploading(false);
    }
  }, [uploadFiles, accountId, loginResponse?.id, fetchDocuments]);

  // Document actions
  const handleDownload = useCallback((url: string, docName: string) => {
    saveAs(url, docName);
  }, []);

  const handlePreview = useCallback((doc: DocumentList[0]) => {
    const extension = doc.doc_name.split('.').pop()?.toLowerCase() || '';
    const docType = DOCUMENT_TYPES[extension as keyof typeof DOCUMENT_TYPES];
    
    setPreviewDoc({
      name: doc.doc_name,
      url: doc.url,
      type: docType?.type || 'document'
    });
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  // Helper function to get document type
  const getDocumentType = useCallback((filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return DOCUMENT_TYPES[extension as keyof typeof DOCUMENT_TYPES];
  }, []);

  // Render functions
  const renderDocumentPreview = useCallback((doc: DocumentList[0]) => {
    const extension = doc.doc_name.split('.').pop()?.toLowerCase() || 'default';
    const isImage = ['jpg', 'jpeg', 'png'].includes(extension);
    
    return (
      <div className="h-48 flex items-center justify-center bg-gray-50 rounded-t-lg overflow-hidden">
        {isImage ? (
          <img 
            src={doc.url} 
            alt={doc.doc_name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            {(() => {
              const IconComponent = DOCUMENT_TYPES[extension as keyof typeof DOCUMENT_TYPES]?.icon || FileText;
              return <IconComponent className="w-12 h-12 text-gray-400" />;
            })()}
            <span className="text-sm text-gray-500 truncate max-w-32">
              {extension?.toUpperCase() || 'FILE'}
            </span>
          </div>
        )}
      </div>
    );
  }, []);

  const renderGridView = useCallback(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {documents.map(doc => {
        const docType = getDocumentType(doc.doc_name);
        
        return (
          <Card key={doc.id} className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 rounded-lg">
            {renderDocumentPreview(doc)}
            <CardContent className="p-4">
              <div className="space-y-2">
                <h3 className="font-medium text-sm truncate" title={doc.doc_name}>
                  {doc.doc_name}
                </h3>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  {moment(doc.created_at).format('MMM DD, YYYY')}
                </div>
                <Badge variant="secondary" className={cn("text-xs", docType?.color)}>
                  {docType?.label || 'Document'}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(doc.url, doc.doc_name)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  ), [documents, handleDownload, handlePreview, renderDocumentPreview, getDocumentType]);

  const renderListView = useCallback(() => (
    <div className="space-y-2">
      {documents.map(doc => {
        const docType = getDocumentType(doc.doc_name);
        const IconComponent = docType?.icon || FileText;
        
        return (
          <Card key={doc.id} className="hover:shadow-md transition-shadow rounded-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className={cn("p-2 rounded-lg", docType?.color || "bg-gray-100 text-gray-600")}>
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" title={doc.doc_name}>
                      {doc.doc_name}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <div className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {moment(doc.created_at).format('MMM DD, YYYY')}
                      </div>
                      <Badge variant="secondary" className={cn("text-xs", docType?.color)}>
                        {docType?.label || 'Document'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(doc)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Preview</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc.url, doc.doc_name)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  ), [documents, handleDownload, handlePreview, getDocumentType]);

  return (
    <TooltipProvider>
      <div className="p-6 bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setUploadModalVisible(true)}
              disabled={!canUpload || isLeadInOnboarding}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Documents</span>
            </Button>
            <div className="flex items-center space-x-1 border rounded-lg p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Grid View</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded yet</h3>
            <p className="text-gray-500">Upload your first document to get started</p>
          </div>
        ) : (
          viewMode === "grid" ? renderGridView() : renderListView()
        )}

        {/* Upload Modal */}
        <Dialog open={uploadModalVisible} onOpenChange={setUploadModalVisible}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Drag and Drop Area */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300",
                  uploading && "opacity-50 pointer-events-none"
                )}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Click or drag files to upload
                </h3>
                <p className="text-gray-500 mb-4">
                  Support for PDF, Word, Excel, and image files
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpeg,.jpg,.png"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span>Select Files</span>
                  </Button>
                </label>
              </div>

              {/* File List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <h4 className="font-medium text-gray-900">Selected Files</h4>
                  {uploadFiles.map((file, index) => {
                    const docType = getDocumentType(file.file.name);
                    const IconComponent = docType?.icon || FileText;
                    
                    return (
                      <Card key={index} className="p-3 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={cn("p-2 rounded-lg", docType?.color || "bg-gray-100 text-gray-600")}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate" title={file.file.name}>
                                {file.file.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(file.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {file.status === 'uploading' && file.progress > 0 && (
                              <div className="w-24">
                                <Progress value={file.progress} className="h-2" />
                              </div>
                            )}
                            {file.status === 'done' && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Done
                              </Badge>
                            )}
                            {file.status === 'error' && (
                              <Badge variant="destructive">
                                Error
                              </Badge>
                            )}
                            {!uploading && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFileRemove(file)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  if (!uploading) {
                    setUploadModalVisible(false);
                    setUploadFiles([]);
                  }
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploadFiles.length === 0 || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${uploadFiles.length > 0 ? `(${uploadFiles.length})` : ''}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Document Viewer Dialog */}
        <DocumentViewerDialog
          open={!!previewDoc}
          onOpenChange={(open) => {
            if (!open) setPreviewDoc(null);
          }}
          document={previewDoc}
        />
      </div>
    </TooltipProvider>
  );
};

export default SalesDocumnets;