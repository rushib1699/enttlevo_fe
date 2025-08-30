import { DataGrid } from '@mui/x-data-grid';
import React, { useState } from 'react'

interface MonthlyPaymentsData {
  srNo: number; 
  account_id: number;
  refNumber: string | null;
  payment_date: string;
  payment_status: number;
  name: string;
}

interface MonthlyPaymentsData {
  monthlyPaymentsData: MonthlyPaymentsData[];
}


const AMMonthlyPayments: React.FC<MonthlyPaymentsData> = ({ monthlyPaymentsData }) => {
  const [pageSize, setPageSize] = useState(10);


  const columns = [
    {
      field: 'srNo',
      headerName: 'Sr No',
      minWidth: 120,
      renderCell: (params: any) => params.rowIndex + 1,
      sortable: false,
      headerClassName: "table-header",
    },
    {
      field: 'name',
      headerName: 'Account Name',
      minWidth: 400,
      sortable: false,
      headerClassName: "table-header",
    },
    {
      field: 'payment_status',
      headerName: 'Payment Status',
      minWidth: 350,
      renderCell: (params: any) => params.value === 0 ? 'Failed' : 'Success',
      sortable: false,
      headerClassName: "table-header",
      flex: 1,
    },
    {
      field: 'payment_date',
      headerName: 'Due Date',
      minWidth: 350,
      sortable: false,
      flex: 1,
      headerClassName: "table-header",
    },
  ];


  return (
    <div style={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
      <DataGrid
        rows={monthlyPaymentsData}
        columns={columns}
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
  )
}

export default AMMonthlyPayments