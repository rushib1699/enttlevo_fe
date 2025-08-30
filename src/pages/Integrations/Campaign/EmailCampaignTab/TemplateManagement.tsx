import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, MoreVertical, FileText, Eye, Edit, Trash2, Code, Palette, FileCode } from 'lucide-react';
import { toast } from 'sonner';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { createTemplate, getTemplates, deleteTemplate } from '@/api';
import { useNavigate } from 'react-router-dom';

interface EmailTemplate {
  id: number;
  template_name: string;
  template: string;
  created_at: string;
  is_active: number;
  is_deleted: number;
  created_by: string;
  updated_by: string;
  company_basic_details_id: number;
}

const TemplateManagement: React.FC = () => {
  const navigate = useNavigate();
  const { loginResponse } = useApplicationContext();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [isPreviewSheetOpen, setIsPreviewSheetOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [activeTab, setActiveTab] = useState('visual');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isPreviewSheetOpen) {
          closePreviewSheet();
        }
        if (isCreateSheetOpen) {
          setIsCreateSheetOpen(false);
          resetForm();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPreviewSheetOpen, isCreateSheetOpen]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup all sheet states when component unmounts
      setIsCreateSheetOpen(false);
      setIsPreviewSheetOpen(false);
      setSelectedTemplate(null);
      resetForm();
      setLoading(false);
    };
  }, []);

  const resetForm = useCallback(() => {
    setTemplateName('');
    setTemplateContent('');
    setActiveTab('visual');
  }, []);

  const handleSheetChange = useCallback((open: boolean) => {
    if (!mounted) return; // Prevent state changes if not mounted
    
    if (open) {
      // Close any other open sheets first
      setIsPreviewSheetOpen(false);
      setSelectedTemplate(null);
    } else {
      // When closing, ensure proper cleanup with delay
      setTimeout(() => {
        resetForm();
      }, 100);
    }
    setIsCreateSheetOpen(open);
  }, [mounted, resetForm]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await getTemplates({
        company_id: loginResponse?.company_id || 0,
      });
      setTemplates(response || []);
    } catch (error) {
      toast.error('Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    if (!templateContent.trim()) {
      toast.error('Please enter template content');
      return;
    }

    try {
      await createTemplate({
        name: templateName,
        template: templateContent,
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      
      toast.success('Template created successfully');
      resetForm();
      setIsCreateSheetOpen(false);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to create template');
    }
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (loading) return; // Prevent deletion during loading
    
    if (window.confirm(`Are you sure you want to delete "${template.template_name}"?`)) {
      try {
        setLoading(true); // Add loading state
        await deleteTemplate({
          template_id: template.id,
          company_id: loginResponse?.company_id || 0,
          user_id: loginResponse?.id || 0,
          delete_bool: 1,
        });
        toast.success('Template deleted successfully');
        fetchTemplates();
      } catch (error) {
        toast.error('Failed to delete template');
      } finally {
        setLoading(false); // Always reset loading
      }
    }
  };

  const openPreviewSheet = useCallback((template: EmailTemplate) => {
    if (!mounted || loading) return; // Prevent opening if not mounted or loading
    
    // Close create sheet if open
    if (isCreateSheetOpen) {
      setIsCreateSheetOpen(false);
      resetForm();
    }
    
    // Set states with delay to ensure proper cleanup
    setTimeout(() => {
      setSelectedTemplate(template);
      setIsPreviewSheetOpen(true);
    }, 100);
  }, [mounted, loading, isCreateSheetOpen, resetForm]);

  const closePreviewSheet = useCallback(() => {
    if (!mounted) return; // Prevent closing if not mounted
    
    setIsPreviewSheetOpen(false);
    // Cleanup with delay
    setTimeout(() => {
      setSelectedTemplate(null);
    }, 100);
  }, [mounted]);

  const handlePreviewSheetChange = useCallback((open: boolean) => {
    if (!mounted) return; // Prevent state changes if not mounted
    
    if (open) {
      // Close any other open sheets first
      setIsCreateSheetOpen(false);
      resetForm();
    } else {
      // When closing, ensure proper cleanup
      setTimeout(() => {
        setSelectedTemplate(null);
      }, 100);
    }
    setIsPreviewSheetOpen(open);
  }, [mounted, resetForm]);

  const insertPlaceholder = (placeholder: string) => {
    setTemplateContent(prev => prev + placeholder);
  };

  const defaultTemplateBlocks = [
    {
      name: 'Header',
      content: `<div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
  <h1 style="color: #333; margin: 0;">{{company_name}}</h1>
</div>`
    },
    {
      name: 'Welcome Section',
      content: `<div style="padding: 20px;">
  <h2>Hello {{first_name}}!</h2>
  <p>Welcome to our newsletter. We're excited to have you on board.</p>
</div>`
    },
    {
      name: 'Content Block',
      content: `<div style="padding: 20px; background-color: #ffffff;">
  <h3>{{content_title}}</h3>
  <p>{{content_body}}</p>
</div>`
    },
    {
      name: 'CTA Button',
      content: `<div style="text-align: center; padding: 20px;">
  <a href="{{cta_url}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">{{cta_text}}</a>
</div>`
    },
    {
      name: 'Footer',
      content: `<div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666;">
  <p>© {{current_year}} {{company_name}}. All rights reserved.</p>
  <p>{{unsubscribe_link}}</p>
</div>`
    }
  ];

  const placeholders = [
    '{{first_name}}',
    '{{last_name}}',
    '{{email}}',
    '{{company_name}}',
    '{{current_date}}',
    '{{current_year}}',
    '{{unsubscribe_link}}'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Template Management</h2>
          <p className="text-gray-600">Create and manage email templates</p>
        </div>
        {mounted && (
          <>
            {/* Create Template Sheet */}
            <Sheet 
              open={isCreateSheetOpen} 
              onOpenChange={handleSheetChange}
            >
              <SheetTrigger asChild>
                <div className="flex gap-2">
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Template
                  </Button>
                  <Button className="flex items-center gap-2" onClick={() => navigate('/integrations/email-builder')}>
                    <FileCode className="h-4 w-4" />
                    Email Builder
                  </Button>
                </div>
              </SheetTrigger>
              <SheetContent 
                side="right"
                className="w-[90vw] sm:max-w-[90vw] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>Create Email Template</SheetTitle>
                  <SheetDescription>
                    Design your email template using the visual editor or HTML code.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name</Label>
                    <Input
                      id="templateName"
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="Enter template name..."
                    />
                  </div>

                  <div className="w-full">
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button
                          onClick={() => setActiveTab('visual')}
                          className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'visual' 
                              ? 'border-primary text-primary' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                          `}
                        >
                          <Palette className="h-4 w-4" />
                          Visual Editor
                        </button>
                        <button
                          onClick={() => setActiveTab('code')} 
                          className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeTab === 'code'
                              ? 'border-primary text-primary'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                          `}
                        >
                          <Code className="h-4 w-4" />
                          HTML Code
                        </button>
                      </nav>
                    </div>

                    <div className="mt-4">
                      {activeTab === 'visual' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Template Blocks */}
                            <div className="space-y-4">
                              <h4 className="font-medium">Template Blocks</h4>
                              <div className="space-y-2">
                                {defaultTemplateBlocks.map((block, index) => (
                                  <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => setTemplateContent(prev => prev + '\n' + block.content)}
                                  >
                                    {block.name}
                                  </Button>
                                ))}
                              </div>
                              
                              <h4 className="font-medium mt-6">Placeholders</h4>
                              <div className="grid grid-cols-1 gap-1">
                                {placeholders.map((placeholder, index) => (
                                  <Button
                                    key={index}
                                    variant="ghost"
                                    size="sm"
                                    className="justify-start text-xs"
                                    onClick={() => insertPlaceholder(placeholder)}
                                  >
                                    {placeholder}
                                  </Button>
                                ))}
                              </div>
                            </div>

                            {/* Editor */}
                            <div className="lg:col-span-2 space-y-2">
                              <Label>Template Content</Label>
                              <Textarea
                                value={templateContent}
                                onChange={(e) => setTemplateContent(e.target.value)}
                                placeholder="Start building your template..."
                                className="min-h-[400px] font-mono text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'code' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>HTML Code</Label>
                              <Textarea
                                value={templateContent}
                                onChange={(e) => setTemplateContent(e.target.value)}
                                placeholder="Enter your HTML code here..."
                                className="min-h-[400px] font-mono text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Preview</Label>
                              <div 
                                className="border rounded p-4 min-h-[400px] bg-white overflow-auto"
                                dangerouslySetInnerHTML={{ __html: templateContent }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <SheetFooter className="mt-4">
                  <Button variant="outline" onClick={() => setIsCreateSheetOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>Create Template</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Preview Sheet */}
            <Sheet 
              open={isPreviewSheetOpen} 
              onOpenChange={handlePreviewSheetChange}
            >
              <SheetContent 
                side="right"
                className="w-[80vw] sm:max-w-[80vw]"
              >
                <SheetHeader>
                  <SheetTitle>Template Preview: {selectedTemplate?.template_name}</SheetTitle>
                </SheetHeader>
                <div className="max-h-[calc(100vh-200px)] overflow-auto border rounded mt-4">
                  <div 
                    className="p-4 bg-white"
                    dangerouslySetInnerHTML={{ __html: selectedTemplate?.template || '' }}
                  />
                </div>
                <SheetFooter className="mt-4 border-0">
                  <Button onClick={closePreviewSheet}>Close</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </>
        )}
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse rounded-lg">
              <CardHeader className="pb-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={`template-wrapper-${template.id}`} className="relative">
              <Card 
                key={`template-${template.id}`}
                className="hover:shadow-md transition-shadow rounded-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{template.template_name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              openPreviewSheet(template);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template);
                            }} 
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription>
                    Created on {new Date(template.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Created By</div>
                        <div className="text-gray-600">{template.created_by}</div>
                      </div>
                      <div>
                        <div className="font-medium">Updated By</div>
                        <div className="text-gray-600">{template.updated_by}</div>
                      </div>
                    </div>
                    <div 
                      onClick={() => openPreviewSheet(template)}
                      className="w-full h-20 overflow-hidden text-xs text-gray-600 border rounded p-2 cursor-pointer"
                      dangerouslySetInnerHTML={{ __html: template.template }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {templates.length === 0 && !loading && (
        <Card className="text-center py-12 rounded-lg">
          <CardContent>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">Create your first email template to get started</p>
            <Button onClick={() => setIsCreateSheetOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TemplateManagement;