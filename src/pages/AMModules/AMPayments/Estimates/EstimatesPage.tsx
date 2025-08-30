import React, { useState, useEffect } from "react";
import {
    Box,
    CircularProgress,
    Chip,
    Divider,
    Pagination,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DatePicker from '@/components/ui/date-picker';
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

import {
    TableContainer,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
} from "@mui/material";

interface Estimate {
    Id: string;
    DocNumber: string;
    ExpirationDate: string;
    TxnDate: string;
    TxnStatus: string;
    TotalAmt: number;
    CustomerRef: {
        value: string;
        name: string;
    };
    BillAddr: {
        Id?: string;
        Line1: string;
        City: string;
        Country: string;
        CountrySubDivisionCode: string;
        PostalCode: string;
    };
    ShipAddr: {
        Id?: string;
        Line1: string;
        City: string;
        Country: string;
        CountrySubDivisionCode: string;
        PostalCode: string;
    };
    Line: Array<{
        Id?: string;
        LineNum?: number;
        Description?: string;
        Amount: number;
        DetailType: string;
        SalesItemLineDetail?: {
            ItemRef: { value: string; name: string };
            UnitPrice: number;
            Qty: number;
            TaxCodeRef?: {
                value: string;
            };
        };
        SubTotalLineDetail?: Record<string, never>;
    }>;
    TxnTaxDetail?: {
        TotalTax: number;
        TaxLine: Array<{
            Amount: number;
            DetailType: string;
            TaxLineDetail: {
                TaxRateRef?: {
                    value: string;
                };
                PercentBased?: boolean;
                TaxPercent: number;
                NetAmountTaxable: number;
            };
        }>;
    };
    CurrencyRef: {
        value: string;
        name: string;
    };
    BillEmail?: {
        Address: string;
    };
    LinkedTxn?: Array<{
        TxnId: string;
        TxnType: string;
    }>;
}

const EstimatePage: React.FC = () => {
    const [estimates, setEstimates] = useState<Estimate[]>([]);
    const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
    const [openSheet, setOpenSheet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [customerFilter, setCustomerFilter] = useState("");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const resetFilters = () => {
        setCustomerFilter("");
        setStartDate(undefined);
        setEndDate(undefined);
        setPage(1);
    };

    useEffect(() => {
        const fetchEstimates = async () => {
            try {
                const response = await fetch(
                    `https://x3kb-thkl-gi2q.n7e.xano.io/api:RngPLFXd/all_estimates?tenant_id=14&type=prod&start=${page}&per_page=${perPage}`
                );
                const data = await response.json();
                setEstimates(data.estimate || []);
                setTotalCount(data.total_count || 0);
            } catch (error) {
                console.error("Error fetching estimates:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEstimates();
    }, [page, perPage]);

    const columns: GridColDef[] = [
        { field: "DocNumber", headerName: "Estimate #", flex: 1 },
        { field: "Customer", headerName: "Customer", flex: 1 },
        {
            field: "TotalAmt",
            headerName: "Amount",
            flex: 1,
            renderCell: (params) => `${params.row.Currency} ${params.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`,
        },
        {
            field: "TxnDate",
            headerName: "Date",
            flex: 1,
            renderCell: (params) => new Date(params.value).toLocaleDateString(),
        },
        {
            field: "ExpirationDate",
            headerName: "Expiration Date",
            flex: 1,
            renderCell: (params) => new Date(params.value).toLocaleDateString(),
        },
        {
            field: "TxnStatus",
            headerName: "Status",
            flex: 1,
            renderCell: (params) => (
                <Chip 
                    label={params.value} 
                    color={params.value === "Closed" ? "success" : "warning"} 
                    size="small" 
                />
            ),
        },
    ];

    const filteredRows = estimates
        .filter(est => {
            const matchesCustomer = est.CustomerRef.name.toLowerCase().includes(customerFilter.toLowerCase());
            const estimateDate = new Date(est.TxnDate);
            const matchesDateRange = (!startDate || estimateDate >= startDate) &&
                (!endDate || estimateDate <= endDate);
            return matchesCustomer && matchesDateRange;
        })
        .map((est) => ({
            id: est.Id,
            DocNumber: est.DocNumber,
            Customer: est.CustomerRef.name,
            TotalAmt: est.TotalAmt,
            Currency: est.CurrencyRef.value,
            TxnDate: est.TxnDate,
            ExpirationDate: est.ExpirationDate,
            TxnStatus: est.TxnStatus,
            fullData: est,
        }));

    const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <div className="">
            <div className="flex justify-between items-center m-2">
                <h1 className="text-2xl font-bold">Estimates</h1>
                <Button variant="outline" onClick={resetFilters}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset Filters
                </Button>
            </div>

            <div className="flex gap-4 p-2 w-full">
                <div className="flex flex-col gap-2 w-1/2">
                    <Label htmlFor="customer">Customer Name</Label>
                    <Input
                        id="customer"
                        placeholder="Filter by customer..."
                        value={customerFilter}
                        onChange={(e) => setCustomerFilter(e.target.value)}
                    />
                </div>
                <div className="flex flex-row gap-2 justify-end w-1/2">
                    <div className="flex flex-col gap-2">
                        <Label>Start Date</Label>
                        <DatePicker
                            date={startDate}
                            setDate={setStartDate}
                            placeholder="Start Date"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <Label>End Date</Label>
                        <DatePicker
                            date={endDate}
                            setDate={setEndDate}
                            placeholder="End Date"
                        />
                    </div>
                </div>
            </div>

            <Box sx={{ height: "auto", width: "100%" }}>
                <DataGrid
                    rows={filteredRows}
                    columns={columns}
                    pageSizeOptions={[5, 10, 25, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    disableRowSelectionOnClick
                    onRowClick={(params) => {
                        setSelectedEstimate(params.row.fullData);
                        setOpenSheet(true);
                    }}
                    paginationModel={{ page, pageSize: perPage }}
                    onPaginationModelChange={(model) => {
                        setPage(model.page);
                        setPerPage(model.pageSize);
                    }}
                />
            </Box>


            {/* Estimate Sheet */}
            <Sheet open={openSheet} onOpenChange={(open) => setOpenSheet(open)}>
                <SheetContent className="sm:max-w-[1000px] h-screen p-8 overflow-y-auto">
                    {selectedEstimate && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold">ESTIMATE</h3>
                                <div className="text-right space-y-1">
                                    <p>Estimate #: {selectedEstimate.DocNumber}</p>
                                    <p>Date: {new Date(selectedEstimate.TxnDate).toLocaleDateString()}</p>
                                    <p>Expiration Date: {new Date(selectedEstimate.ExpirationDate).toLocaleDateString()}</p>
                                    <p>Status: {selectedEstimate.TxnStatus}</p>
                                    <p>Currency: {selectedEstimate.CurrencyRef.name}</p>
                                    {selectedEstimate.LinkedTxn && selectedEstimate.LinkedTxn.length > 0 && (
                                        <p className="text-sm text-gray-500">Linked {selectedEstimate.LinkedTxn[0].TxnType} #: {selectedEstimate.LinkedTxn[0].TxnId}</p>
                                    )}
                                </div>
                            </div>

                            <Divider className="my-4" />

                            {/* Billing Info */}
                            <div className="flex justify-between mb-6">
                                <div className="space-y-1">
                                    <p className="font-bold">Bill To:</p>
                                    <p>{selectedEstimate.CustomerRef.name}</p>
                                    <p>{selectedEstimate.BillAddr.Line1}</p>
                                    <p>{selectedEstimate.BillAddr.City}, {selectedEstimate.BillAddr.CountrySubDivisionCode}</p>
                                    <p>{selectedEstimate.BillAddr.PostalCode}</p>
                                    <p>{selectedEstimate.BillAddr.Country}</p>
                                    {selectedEstimate.BillEmail && (
                                        <p>Email: {selectedEstimate.BillEmail.Address}</p>
                                    )}
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="font-bold">Ship To:</p>
                                    <p>{selectedEstimate.CustomerRef.name}</p>
                                    <p>{selectedEstimate.ShipAddr.Line1}</p>
                                    <p>{selectedEstimate.ShipAddr.City}, {selectedEstimate.ShipAddr.CountrySubDivisionCode}</p>
                                    <p>{selectedEstimate.ShipAddr.PostalCode}</p>
                                    <p>{selectedEstimate.ShipAddr.Country}</p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                            <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>Item</TableCell>
                                            <TableCell sx={{ fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>Description</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>Qty</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>Unit Price</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, borderBottom: '2px solid #e0e0e0' }}>Amount</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedEstimate.Line.map((item, index) =>
                                            item.DetailType !== "SubTotalLineDetail" && (
                                                <TableRow key={index} sx={{
                                                    '&:last-child td': { borderBottom: 0 },
                                                    '&:hover': { backgroundColor: '#fafafa' }
                                                }}>
                                                    <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.SalesItemLineDetail?.ItemRef.name || "Item"}</TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.Description || "-"}</TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid #e0e0e0' }}>{item.SalesItemLineDetail?.Qty || 1}</TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                                        {item.SalesItemLineDetail?.UnitPrice
                                                            ? `${selectedEstimate.CurrencyRef.value} ${item.SalesItemLineDetail.UnitPrice.toFixed(2)}`
                                                            : "-"
                                                        }
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid #e0e0e0' }}>{selectedEstimate.CurrencyRef.value} {item.Amount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Summary */}
                            <div className="flex justify-end">
                                <div className="w-[300px] space-y-2">
                                    <Divider className="mb-2" />
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{selectedEstimate.CurrencyRef.value} {(selectedEstimate.TotalAmt - (selectedEstimate.TxnTaxDetail?.TotalTax || 0)).toFixed(2)}</span>
                                    </div>
                                    {selectedEstimate.TxnTaxDetail && (
                                        <div className="flex justify-between">
                                            <span>Tax ({selectedEstimate.TxnTaxDetail.TaxLine[0].TaxLineDetail.TaxPercent}%):</span>
                                            <span>{selectedEstimate.CurrencyRef.value} {selectedEstimate.TxnTaxDetail.TotalTax.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="font-bold">Total:</span>
                                        <span className="text-primary font-bold">
                                            {selectedEstimate.CurrencyRef.value} {selectedEstimate.TotalAmt.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-4" />
                            
                            {/* Footer Notes */}
                            <p className="text-sm text-gray-500">
                                This is an estimate, not an invoice. Please approve before the expiration date.
                            </p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default EstimatePage;
