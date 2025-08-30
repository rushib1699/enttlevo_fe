import { DataGrid, GridColDef } from '@mui/x-data-grid';
import React, { useState } from 'react'

interface UserAM {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface UserAMTableProps {
  data: UserAM[];
  loading: boolean;
}

const UserAMTable: React.FC<UserAMTableProps> = ({ data, loading }) => {
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
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'address', headerName: 'Address', width: 200 }
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

export default UserAMTable