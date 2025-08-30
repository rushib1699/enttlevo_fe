import { useState, useEffect, useMemo } from "react";
import { Search, Layers, GitBranch, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLocation, useNavigate } from "react-router-dom";
import { TypeoW } from "@/types";
import { createWorkflow, updateWorkflow } from "@/api";
import { toast } from "sonner";
import { useApplicationContext } from "@/hooks/useApplicationContext";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DataGrid } from "@mui/x-data-grid";


interface Workflow {
  id: number;
  name: string;
  workflow_type: string;
  is_published: number;
  created_at: string;
  updated_at: string;
  is_active: number;
  created_relative: string;
  updated_relative: string;
}

interface WorkflowDashboardTableProps {
  workflows: Workflow[];
  emailWorkflows: Workflow[];
  generalWorkflows: Workflow[];
}

const WorkflowTable = ({
  workflows,
  emailWorkflows,
  generalWorkflows,
}: WorkflowDashboardTableProps) => {
  const [searchText, setSearchText] = useState("");
  const pathname = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [filteredWorkflows, setFilteredWorkflows] = useState<Workflow[]>();
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState<string>("");
  const [workflowType, setWorkflowType] = useState<TypeoW>(TypeoW.GENERAL);
  const [selectedStatus, setSelectedStatus] = useState<boolean>(true);
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const { loginResponse } = useApplicationContext();
  const [updatingWorkflowType, setUpdatingWorkflowType] = useState(false);

  if (!loginResponse) return null;

  const onCreateWorkflow = async () => {
    const response = await createWorkflow({
      name: workflowName,
      type: workflowType,
      company_id: loginResponse.company_id,
      user_id: loginResponse.id,
    });

    navigate(
      `/integrations/workflows/${workflowName}?type=${workflowType}&workflowId=${response.id}`
    );
  };

  const handleWTypeChange = async (row: any, value: TypeoW) => {
    setUpdatingWorkflowType(true);
    try {
      await updateWorkflow({
        id: row.id,
        company_id: loginResponse.company_id,
        user_id: loginResponse.id,
        type: value,
      });
      toast.success("Workflow type updated successfully");
      row.workflow_type = value;
    } catch (error) {
      console.log(error);
      toast.error("Error updating workflow type");
    } finally {
      setUpdatingWorkflowType(false);
    }
  };

  const onNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflowName(e.target.value);
  };

  const onTypeChange = (value: TypeoW) => {
    setWorkflowType(value);
  };

  const onModalSubmit = () => {
    setIsCreatingWorkflow(true);
    try {
      onCreateWorkflow();
    } catch (e) {
      toast.error("Error creating workflow");
    } finally {
      setModalOpen(false);
      setIsCreatingWorkflow(false);
    }
  };

  const onModalCancel = () => {
    setModalOpen(false);
    setWorkflowName("");
    setWorkflowType(TypeoW.GENERAL);
  };

  const handleRowClick = (record: Workflow) => {
    navigate(
      `/integrations/workflows/${record.name}?type=${record.workflow_type}&workflowId=${record.id}`
    );
  };

  useEffect(() => {
    let filteredData = workflows;

    if (selectedFilter === "email") {
      filteredData = emailWorkflows;
    } else if (selectedFilter === "general") {
      filteredData = generalWorkflows;
    }

    if (searchText.trim()) {
      filteredData = filteredData.filter((workflow) =>
        workflow.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedStatus) {
      filteredData = filteredData.filter(
        (workflow) => workflow.is_active === 1
      );
    } else {
      filteredData = filteredData.filter(
        (workflow) => workflow.is_active === 0
      );
    }

    setFilteredWorkflows(filteredData);
  }, [
    searchText,
    selectedFilter,
    workflows,
    emailWorkflows,
    generalWorkflows,
    selectedStatus,
  ]);

  const columns = useMemo(
    () => [
      {
        headerName: "Name",
        field: "name",
        sortable: true,
        flex: 1.5,
        renderCell: (params: any) => {
          const { row } = params;
          return (
            <div className="flex items-center justify-start h-full gap-2 cursor-pointer" onClick={() => handleRowClick(row)}>
              <p className="font-semibold text-sm">{row.name}</p>
            </div>
          );
        },
        headerClassName: "table-header"
      },
      {
        headerName: "Type",
        flex: 1,
        field: "workflow_type",
        sortable: true,
        renderCell: (params: any) => {
          const { row } = params;
          return (
            <Select
              defaultValue={row.workflow_type}
              value={row.workflow_type}
              disabled={updatingWorkflowType}
              onValueChange={(value) => handleWTypeChange(row, value)}
              onClick={(e: any) => e.stopPropagation()}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TypeoW.GENERAL}>General</SelectItem>
                <SelectItem value={TypeoW.EMAIL}>Email</SelectItem>
              </SelectContent>
            </Select>
          );
        },
        headerClassName: "table-header"
      },
      {
        headerName: "Created",
        flex: 1,
        field: "created_relative",
        sortable: true,
        renderCell: (params: any) => {
          const { row } = params;
          return (
            <p className="text-[13px] font-semibold text-gray-500">
              {formatDistanceToNow(new Date(row.created_at), {
                addSuffix: true,
              })}
            </p>
          );
        },
        headerClassName: "table-header"
      },
      {
        headerName: "Last Modified", 
        field: "updated_at",
        flex: 1,
        sortable: true,
        renderCell: (params: any) => {
          const { row } = params;
          return (
            <p className="text-[13px] font-semibold text-gray-500">
              {formatDistanceToNow(new Date(row.updated_at), {
                addSuffix: true,
              })}
            </p>
          );
        },
        headerClassName: "table-header"
      },
      {
        headerName: "Published",
        field: "is_published",
        flex: 1,
        sortable: true,
        renderCell: (params: any) => {
          const { row } = params;
          return (
            <>
              <div className="flex items-center h-full">
                {row.is_published ? (
                  <span className="rounded-lg bg-green-200 text-green-600 border border-green-500 flex items-center justify-center w-fit px-2 py-[2px]">
                    <p className="text-xs">Published</p>
                  </span>
                ) : (
                  <span className="rounded-lg bg-gray-200 text-gray-600 border border-gray-500 flex items-center justify-center w-fit px-2 py-[2px]">
                    <p className="text-xs">Draft</p>
                  </span>
                )}
              </div>
            </>
          );
        },
        headerClassName: "table-header"
      },
    ],
    []
  );

  return (
    <div className="p-2">
      <div className="mb-2 flex items-center gap-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 py-2 px-2 bg-gray-50 rounded-lg border border-gray-200">
            <Search className="text-gray-600" />
            <Input
              className="outline-none bg-transparent text-xs text-gray-800 placeholder:text-gray-700 border-0"
              placeholder="Search workflows..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Layers className="h-4 w-4" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedStatus(true)}>
                  <div className="flex items-center justify-between w-full">
                    Active
                    {selectedStatus === true && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedStatus(false)}>
                  <div className="flex items-center justify-between w-full">
                    Inactive
                    {selectedStatus === false && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <GitBranch className="h-4 w-4" />
                  Type
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedFilter("all")}>
                  <div className="flex items-center justify-between w-full">
                    All
                    {selectedFilter === "all" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("email")}>
                  <div className="flex items-center justify-between w-full">
                    Email
                    {selectedFilter === "email" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter("general")}>
                  <div className="flex items-center justify-between w-full">
                    General
                    {selectedFilter === "general" && <Check className="h-4 w-4" />}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button>Create Workflow</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a workflow</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name:</label>
                    <Input
                      value={workflowName}
                      onChange={onNameChange}
                      disabled={isCreatingWorkflow}
                      placeholder="Enter workflow name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select type:</label>
                    <Select
                      value={workflowType}
                      onValueChange={onTypeChange}
                      disabled={isCreatingWorkflow}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TypeoW.GENERAL}>General</SelectItem>
                        <SelectItem value={TypeoW.EMAIL}>Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onModalCancel}>
                      Cancel
                    </Button>
                    <Button onClick={onModalSubmit} disabled={isCreatingWorkflow}>
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <DataGrid
        columns={columns}
        rows={filteredWorkflows || []}
        pagination
        initialState={{
          sorting: {
            sortModel: [{ field: "updated_at", sort: "desc" }],
          },
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        pageSizeOptions={[5, 10, 25, { value: -1, label: "All" }]}
        sx={{
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#1976d2',
            color: 'black',
            fontSize: '15px',
            fontWeight: 'bold',
          },
          '& .table-header': {
            backgroundColor: '#424758',
            color: 'white', 
            fontSize: '15px',
            fontWeight: 'bold',
          }
        }}
      />
    </div>
  );
};

export default WorkflowTable;