import React, { useState } from 'react'
import { DataGrid } from '@mui/x-data-grid';

interface RenewalData {
  srNo: number;
  name: string;
  formatted_contract_start_date: string;
  formatted_renewal_date: string;
  contract_value: number;
}

interface MonthlyRenewalsData {
  monthlyRenewalsData: RenewalData[];
}



const AMMonthlyRenewals: React.FC<MonthlyRenewalsData> = ({ monthlyRenewalsData }) => {

  const [pageSize, setPageSize] = useState(10);

  const columns = [
    {
      field: 'srNo',
      headerName: 'Sr No',
      renderCell: (params: any) => params.api.getRowIndex(params.id) + 1,
      sortable: false,
      minWidth: 100,
      headerClassName: "table-header",
    },
    {
      field: 'name',
      headerName: 'Account Name',
      sortable: false,
      minWidth: 400,
      headerClassName: "table-header",
    },
    {
      field: 'formatted_contract_start_date',
      headerName: 'Contract Start Date',
      sortable: false,
      minWidth: 210,
      headerClassName: "table-header",
      flex: 1,
    },
    {
      field: 'formatted_renewal_date',
      headerName: 'Contract Renewal Date',
      sortable: false,
      minWidth: 210,
      headerClassName: "table-header",
      flex: 1,
    },
    {
      field: 'contract_value',
      headerName: 'Contract Value',
      sortable: false,
      minWidth: 300,
      headerClassName: "table-header",
      flex: 1,
    },
  ];

  return (
    <div style={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
      <DataGrid
        rows={monthlyRenewalsData}
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

export default AMMonthlyRenewals