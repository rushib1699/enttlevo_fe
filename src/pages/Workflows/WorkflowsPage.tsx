import { useApplicationContext } from "@/hooks/useApplicationContext";
import { TypeoW } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { getWorkflowsByCompanyId, getWorkflowsByType } from "@/api";
import WorkflowTable from "@/components/Table/WorkflowTable";
import { useWorkflowStore } from "@/hooks/useWorkflowStore";
import { Card } from "@/components/ui/card";

const WorkflowsPage = () => {
  const [companyWorkflowsByEmail, setCompanyWorkflowsByEmail] = useState([]);
  const [companyWorkflowsByGeneral, setCompanyWorkflowsByGeneral] = useState(
    []
  );
  const [companyWorkflows, setCompanyWorkflows] = useState([]);
  const [isFetchingWorkflows, setIsFetchingWorkflows] = useState(true);
  const { loginResponse } = useApplicationContext();
  const state = useWorkflowStore((state: any) => state);

  if (!loginResponse) return null;

  const getEmailWorkflows = useCallback(async () => {
    try {
      const response = await getWorkflowsByType({
        company_id: loginResponse.company_id,
        type: TypeoW.EMAIL,
      });
      const updatedResponse = response.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        workflow_type: workflow.workflow_type,
        is_active: workflow.is_active,
        is_published: workflow.is_published,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        created_relative: formatDistanceToNow(new Date(workflow.created_at), {
          addSuffix: true,
        }),
        updated_relative: formatDistanceToNow(new Date(workflow.updated_at), {
          addSuffix: true,
        }),
      }));
      setCompanyWorkflowsByEmail(updatedResponse);
    } catch (error) {
      console.log(error);
      setCompanyWorkflowsByEmail([]);
    }
  }, [loginResponse?.company_id]);
  const getGeneralWorkflows = useCallback(async () => {
    try {
      const response = await getWorkflowsByType({
        company_id: loginResponse.company_id,
        type: TypeoW.GENERAL,
      });
      const updatedResponse = response.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        workflow_type: workflow.workflow_type,
        is_active: workflow.is_active,
        is_published: workflow.is_published,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        created_relative: formatDistanceToNow(new Date(workflow.created_at), {
          addSuffix: true,
        }),
        updated_relative: formatDistanceToNow(new Date(workflow.updated_at), {
          addSuffix: true,
        }),
      }));
      setCompanyWorkflowsByGeneral(updatedResponse);
    } catch (error) {
      console.log(error);
      setCompanyWorkflowsByGeneral([]);
    }
  }, [loginResponse?.company_id]);

  const getAllWorkflows = useCallback(async () => {
    try {
      const resp = await getWorkflowsByCompanyId({
        company_id: loginResponse.company_id,
      });
      const updatedResponse = resp.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        workflow_type: workflow.workflow_type,
        is_published: workflow.is_published,
        is_active: workflow.is_active,
        created_at: workflow.created_at,
        updated_at: workflow.updated_at,
        created_relative: formatDistanceToNow(new Date(workflow.created_at), {
          addSuffix: true,
        }),
        updated_relative: formatDistanceToNow(new Date(workflow.updated_at), {
          addSuffix: true,
        }),
      }));
      setCompanyWorkflows(updatedResponse);
    } catch (error) {
      console.log(error);
      setCompanyWorkflows([]);
    }
  }, [loginResponse?.company_id]);

  useEffect(() => {
    try {
      setIsFetchingWorkflows(true);
      getAllWorkflows();
      getEmailWorkflows();
      getGeneralWorkflows();
    } catch {
      toast.error("Error fetching workflows");
    } finally {
      setIsFetchingWorkflows(false);
    }
  }, [getEmailWorkflows, getGeneralWorkflows, getAllWorkflows]);

  useEffect(() => {
    state.setIsLoadingWorkflow(true);
  }, []);

  return (
    <div className="">
      {!isFetchingWorkflows ? (
        <div className="">
          <Toaster position="top-center" />
          <Card className="rounded-lg">
            <WorkflowTable
              workflows={companyWorkflows}
              emailWorkflows={companyWorkflowsByEmail}
              generalWorkflows={companyWorkflowsByGeneral}
            />
          </Card>
        </div>
      ) : (
        <div className="w-12 h-12 flex justify-center items-center absolute top-[30%] left-[50%] -translate-x-[50%] -translate-y-[50%]">
          <div className="h-12 animate-spin w-12 border-2 border-t-indigo-400 border-b-indigo-500 border-r-indigo-500 border-l-gray-400 rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default WorkflowsPage;
