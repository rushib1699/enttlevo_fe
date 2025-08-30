import React, { useCallback, useEffect, useState } from "react";
import { getWorkflowTemplate, createNode, createWorkflow, getWorkflow } from "@/api";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { TypeoW } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, FileText, Workflow, Search, Mail, Phone, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";

export type WorkflowTemplate = {
  id: number;
  name: string;
  workflow_type: TypeoW;
  company_basic_details_id: number;
  created_at: string;
  updated_at: string;
  is_active: number;
  is_deleted: number;
  created_by: number;
  updated_by: number;
  workflow_output: string | null;
  is_published: number;
  is_template: number;
};

const WorkflowsLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginResponse } = useApplicationContext();
  const [workflowTemplates, setWorkflowTemplates] = useState<WorkflowTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingTemplateCopy, setIsCreatingTemplateCopy] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  const getWorkflowIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'email':
        return <Mail className="w-6 h-6 text-blue-600" />;
      case 'call':
        return <Phone className="w-6 h-6 text-blue-600" />;
      case 'general':
        return <Settings className="w-6 h-6 text-blue-600" />;
      default:
        return <Workflow className="w-6 h-6 text-blue-600" />;
    }
  };

  const getWorkflowTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getWorkflowTemplate();
      if (response) {
        setWorkflowTemplates(response);
        setFilteredTemplates(response);
      } else {
        setWorkflowTemplates([]);
        setFilteredTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching workflow templates:", error);
      //toast.error("Failed to fetch workflow templates");
      setWorkflowTemplates([]);
      setFilteredTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTemplateWorkflow = async (template: WorkflowTemplate) => {
    if (!loginResponse?.company_id || !loginResponse?.id) {
      toast.error("User information not available");
      return;
    }

    setIsCreatingTemplateCopy(true);
    setSelectedTemplate(template);
    
    try {
      const resp1 = await getWorkflow({
        company_id: loginResponse.company_id,
        workflow_id: template.id,
        is_template: 1,
      });
      
      const resp2 = await createWorkflow({
        name: resp1.name,
        type: resp1.workflow_type,
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
      });
      
      const nodes = resp1.nodes;
      
      // Create nodes sequentially to avoid race conditions
      for (const node of nodes) {
        await createNode({
          uuid: node.uuid,
          use_input: node.use_input,
          prompt: node.prompt,
          background_prompt: node.background_prompt,
          input: node.input,
          sort: node.sort,
          ai_model: node.ai_model,
          temperature: node.temperature,
          company_id: loginResponse.company_id,
          user_id: loginResponse.id,
          workflow_id: resp2.id,
        });
      }
      
      toast.success("Workflow created successfully. Redirecting ...");
      setTimeout(() => {
        navigate(
          `/integrations/workflows/${resp1.name}?type=${resp1.workflow_type}&workflowId=${resp2.id}`
        );
      }, 2000);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsCreatingTemplateCopy(false);
      setSelectedTemplate(null);
    }
  };

  useEffect(() => {
    getWorkflowTemplates();
  }, []);

  useEffect(() => {
    const filtered = workflowTemplates.filter(template => 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.workflow_type.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTemplates(filtered);
  }, [searchTerm, workflowTemplates]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading workflow templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="mb-2">
        <h1 className="text-xl font-bold">Workflow Templates</h1>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search templates by name or type..."
            className="pl-10 w-full max-w-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {filteredTemplates.map((template) => (
          <Card 
            key={template.id} 
            className="transform transition-all duration-300 rounded-lg"
          >
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="flex items-center gap-3">
                {getWorkflowIcon(template.workflow_type)}
                <span className="text-xl">{template.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold">Type:</span> {template.workflow_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    <span className="font-semibold">Created:</span> {formatDate(template.created_at)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">
                    <span className="font-semibold">Status:</span>{' '}
                    {template.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Inactive
                      </span>
                    )}
                  </span>
                </div>
              </div>
              <Button
                onClick={() => createTemplateWorkflow(template)}
                disabled={isCreatingTemplateCopy}
                className="w-full  text-white transition-colors"
              >
                {isCreatingTemplateCopy && selectedTemplate?.id === template.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No templates found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default WorkflowsLibraryPage;