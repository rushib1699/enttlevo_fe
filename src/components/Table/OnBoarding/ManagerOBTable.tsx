import React, { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface ManagerOB {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  company_id: number;
}

interface ManagerOBTableProps {
  data: ManagerOB[];
  loading: boolean;
}

const ManagerOBTable = ({ data, loading }: ManagerOBTableProps) => {
  const [pageSize, setPageSize] = useState(10);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <div className="text-gray-600 font-medium">Loading data...</div>
        </div>
      </div>
    );
  }

  const columns: GridColDef[] = [
    { 
      field: 'id', 
      headerName: 'ID', 
      width: 80 
    },
    { 
      field: 'first_name', 
      headerName: 'First Name', 
      width: 200,
    },
    { 
      field: 'last_name', 
      headerName: 'Last Name', 
      width: 200,
    },
    { 
      field: 'username', 
      headerName: 'Username', 
      width: 150 
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      width: 250 
    },
    { 
      field: 'company_id', 
      headerName: 'Company ID', 
      width: 120 
    }
  ];

  return (
    <div style={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
      <DataGrid
        rows={data}
        columns={columns}
        loading={loading}
        checkboxSelection={false}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: pageSize,
            },
          },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        onPaginationModelChange={(model) => setPageSize(model.pageSize)}
        disableRowSelectionOnClick
      />
    </div>
  );
}

export default ManagerOBTable