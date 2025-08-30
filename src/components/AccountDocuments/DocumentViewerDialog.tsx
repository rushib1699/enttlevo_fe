import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    name: string;
    url: string;
    type: string;
  } | null;
}

export const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  open,
  onOpenChange,
  document
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  
  const handleError = () => {
    setLoadError(true);
    setIsLoading(false);
    toast.error('Failed to load document');
  };

  const handleLoad = () => {
    setIsLoading(false);
    setLoadError(false);
  };

  const handleDownload = () => {
    if (document) {
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openInNewTab = () => {
    if (document) {
      window.open(document.url, '_blank');
    }
  };

  // Reset states when document changes
  React.useEffect(() => {
    if (document) {
      setIsLoading(true);
      setLoadError(false);
    }
  }, [document]);

  const renderDocumentViewer = () => {
    if (!document) return null;

    const { url, type, name } = document;

    // For images, display directly
    if (type === 'image') {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <img 
            src={url}
            alt={name}
            onError={handleError}
            onLoad={handleLoad}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            style={{ maxHeight: 'calc(85vh - 150px)' }}
          />
        </div>
      );
    }

    // For PDFs, try multiple approaches
    if (type === 'pdf') {
      // First try Google Docs Viewer for better compatibility
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      
      return (
        <div className="relative h-full">
          <iframe
            src={googleViewerUrl}
            onError={() => {
              // Fallback to direct PDF viewing if Google Viewer fails
              const iframe = document.querySelector('#pdf-fallback') as HTMLIFrameElement;
              if (iframe) {
                iframe.src = `${url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`;
              }
            }}
            onLoad={handleLoad}
            className="w-full h-full border-none bg-white rounded-lg"
            style={{ height: 'calc(85vh - 150px)' }}
            title={name}
          />
          
          {/* Fallback iframe for direct PDF viewing */}
          <iframe
            id="pdf-fallback"
            className="w-full h-full border-none bg-white rounded-lg hidden"
            style={{ height: 'calc(85vh - 150px)' }}
            title={`${name} - Fallback`}
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
              <div className="text-sm text-gray-600">Loading PDF document...</div>
              <div className="text-xs text-gray-500 mt-2">
                If the document doesn't load, try downloading it instead
              </div>
            </div>
          )}
        </div>
      );
    }

    // For other document types, use Google Docs Viewer
    const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    
    return (
      <iframe
        src={googleViewerUrl}
        onError={handleError}
        onLoad={handleLoad}
        className="w-full h-full border-none bg-white rounded-lg"
        style={{ height: 'calc(85vh - 150px)' }}
        title={name}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="w-[95vw] max-w-7xl h-[90vh] max-h-[90vh] flex flex-col p-0"
        style={{ 
          width: '95vw', 
          height: '90vh',
          maxWidth: '90vw',
          maxHeight: '90vh'
        }}
      >
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle className="truncate pr-8" title={document?.name}>
            {document?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {loadError ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="text-red-500 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to preview document</h3>
              <p className="text-gray-600 mb-4">
                This document format cannot be previewed in the browser.
              </p>
              <div className="space-x-2">
                <Button onClick={handleDownload} variant="default">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={openInNewTab} variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full p-6">
              {renderDocumentViewer()}
              {isLoading && document?.type !== 'pdf' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-3" />
                  <div className="text-sm text-gray-600">Loading document...</div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 border-t px-6 py-4">
          <div className="flex items-center space-x-2">
            <Button onClick={handleDownload} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button onClick={openInNewTab} variant="outline">
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            <Button onClick={() => onOpenChange(false)} variant="default">
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};