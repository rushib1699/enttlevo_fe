import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Upload, 
  Play, 
  Pause, 
  Info, 
  Trash2, 
  Eye, 
  X, 
  Copy, 
  CheckCircle, 
  Clock,
  FileText,
  Loader2
} from 'lucide-react';

import { useApplicationContext } from '@/hooks/useApplicationContext';
import { uploadAudio, createTranscriptJob, getTranscripts } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import AudioSummarizeModal from '@/components/Model/AudioSummarizeModal';

// Skeleton component for loading states
const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("animate-pulse rounded-md bg-muted", className)}
    {...props}
  />
);

const AudioTranscript: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [uploading, setUploading] = useState(false);
  const [transcripts, setTranscripts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [fileList, setFileList] = useState<File[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedTranscript, setSelectedTranscript] = useState<any>(null);
  const [isTranscriptDrawerVisible, setIsTranscriptDrawerVisible] = useState(false);
  const [isSummarizeModalVisible, setIsSummarizeModalVisible] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [workflowGeneratedOutput, setWorkflowGeneratedOutput] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset play button when audio playback ends
  useEffect(() => {
    const audio = audioRef.current;
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper function to format date in a consistent style
  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return new Date(dateString).toLocaleString('en-GB', options);
  };

  const validateFile = (file: File): boolean => {
    // Check file type
    const isMP3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
    if (!isMP3) {
      toast.error('Only MP3 files are allowed');
      return false;
    }

    // Check file size (50MB limit)
    const isLt50MB = file.size < 50 * 1024 * 1024;
    if (!isLt50MB) {
      toast.error('File must be smaller than 50 MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setFileList([file]);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        audioRef.current.src = url;
      }
    }
  };

  const handleUpload = async () => {
    if (fileList.length === 0) {
      toast.error('Please select an audio file');
      return;
    }

    const file = fileList[0];
    if (!file) {
      toast.error('Unable to retrieve the selected file. Please try again.');
      return;
    }

    // Double-check file type before upload
    const isMP3 = file.type === 'audio/mpeg' || file.name.toLowerCase().endsWith('.mp3');
    if (!isMP3) {
      toast.error('Only MP3 files are allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadResponse = await uploadAudio({ file });

      if (!uploadResponse?.fileUrl) {
        throw new Error('Failed to upload file');
      }

      const transcriptResponse = await createTranscriptJob({
        company_id: Number(loginResponse?.company_id),
        fileUrl: uploadResponse.fileUrl,
        user_id: Number(loginResponse?.id),
        company_customer_id: 0,
        lead_id: 0
      });

      if (transcriptResponse?.jobName) {
        toast.success(`Audio file uploaded and transcription started: ${transcriptResponse?.jobName}`);
        setIsDrawerVisible(false);
        clearFiles();
        fetchTranscripts();
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload audio file');
    } finally {
      setUploading(false);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const fetchTranscripts = useCallback(async () => {
    if (!loginResponse) return;

    setLoading(true);
    try {
      const response = await getTranscripts({
        company_id: Number(loginResponse?.company_id)
      });
      setTranscripts(response);
    } catch (error) {
      console.error('Failed to fetch transcripts:', error);
      toast.error('Failed to load transcripts');
    } finally {
      setLoading(false);
    }
  }, [loginResponse]);

  const getStatusBadge = (isCompleted: number) => {
    return isCompleted === 1 ? (
      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
        <CheckCircle className="w-3 h-3" />
        Completed
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
        <Clock className="w-3 h-3" />
        Pending
      </span>
    );
  };

  const showTranscript = (transcript: any) => {
    setSelectedTranscript(transcript);
    setIsTranscriptDrawerVisible(true);
    setIsSummarizeModalVisible(false);
  };

  const handleCopyTranscript = () => {
    const transcriptText =
      typeof selectedTranscript === 'object'
        ? selectedTranscript.transcript
        : selectedTranscript;
    if (transcriptText) {
      navigator.clipboard
        .writeText(transcriptText)
        .then(() => {
          toast.success('Transcript copied to clipboard');
        })
        .catch(() => {
          toast.error('Failed to copy transcript');
        });
    }
  };

  const clearFiles = () => {
    setFileList([]);
    setPreviewUrl('');
    setIsPlaying(false);
    audioRef.current.pause();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Fetch transcripts when the component mounts
  useEffect(() => {
    fetchTranscripts();
  }, [fetchTranscripts]);


  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  }

  return (
    <div className="">
      <div className="flex flex-col md:flex-row justify-between items-center mb-2">
        <h2 className="text-xl font-bold ">
          Audio Transcription
        </h2>
        <Button
          onClick={() => setIsDrawerVisible(true)}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Audio
        </Button>
      </div>

      {/* Audio Upload Sheet */}
      <Sheet open={isDrawerVisible} onOpenChange={(open) => {
        setIsDrawerVisible(open);
        if (!open) {
          clearFiles();
        }
      }}>
        <SheetContent className="w-[520px] sm:w-[520px] rounded-lg">
          <SheetHeader>
            <SheetTitle>Upload Audio File</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
              <h5 className="flex items-center gap-2 text-blue-700 font-medium mb-3">
                <Info className="w-4 h-4" />
                Instructions
              </h5>
              <ul className="list-disc pl-5 text-blue-600 space-y-1">
                <li>File must be in MP3 format</li>
                <li>Maximum file size: 50MB</li>
                <li>Clear audio quality ensures better transcription</li>
                <li>Avoid background noise for best results</li>
              </ul>
            </div>

            <div className="mt-8">
              <div className="flex justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!fileList.length ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center 
                    hover:border-blue-500 transition-colors cursor-pointer mx-auto"
                    style={{ maxWidth: '400px', height: '200px' }}
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-3 mx-auto" />
                    <p className="text-gray-600 mb-2">Click or drag audio file to upload</p>
                    <p className="text-red-500 text-sm font-medium">MP3 format only</p>
                    <p className="text-gray-400 text-sm">Maximum size: 50MB</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Preview section */}
            {fileList.length > 0 && (
              <div className="mt-6">
                <h5 className="font-medium mb-3">Preview</h5>
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-md 
                  transition-transform transform">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="hover:bg-blue-50"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Play className="w-6 h-6 text-blue-500" />
                    )}
                  </Button>
                  <div className="flex-1 truncate">
                    <p className="font-medium">{fileList[0]?.name}</p>
                    <p className="text-sm text-gray-500">
                      Size: {formatFileSize(fileList[0].size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFiles}
                    className="hover:bg-red-50"
                  >
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsDrawerVisible(false);
                clearFiles();
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={handleUpload}
              disabled={fileList.length === 0 || uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Start Transcription
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Transcripts History Card */}
      <Card className="rounded-lg shadow hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle>Transcripts History</CardTitle>
        </CardHeader>
        <CardContent className='overflow-y-auto'>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {transcripts.map((item: any) => (
                <div
                  key={item.s3_url}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{item.s3_url.split('/').pop()}</h4>
                    <div className="space-y-2 mt-1">
                      {getStatusBadge(item.is_completed)}
                      <p className="text-sm text-gray-500">
                        Created: {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSummarizeModalVisible(false);
                        showTranscript(item.transcript);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsSummarizeModalVisible(true);
                        setSelectedTranscript(item);
                      }}
                      disabled={item.is_completed === 0}
                    >
                      <FileText className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Sheet */}
      <Sheet open={isTranscriptDrawerVisible} onOpenChange={setIsTranscriptDrawerVisible}>
        <SheetContent className="sm:max-w-[900px] w-[100vw]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle>Transcript</SheetTitle>
              {selectedTranscript && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyTranscript}
                  className="text-blue-500 hover:text-blue-700 mt-10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </SheetHeader>
          
          <div className="mt-6">
            {selectedTranscript ? (
              <div className="p-4 bg-gray-50 rounded-lg border max-h-[80vh] overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-800 text-base">
                  {typeof selectedTranscript === 'object'
                    ? selectedTranscript.transcript
                    : selectedTranscript}
                </pre>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p>Transcription in progress...</p>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AudioSummarizeModal
        open={isSummarizeModalVisible}
        onOpenChange={setIsSummarizeModalVisible}
        transcript={selectedTranscript}
        loadingSummary={loadingSummary}
        workflowGeneratedOutput={workflowGeneratedOutput}
        setWorkflowGeneratedOutput={setWorkflowGeneratedOutput}
      />
    </div>
  );
};

export default AudioTranscript;