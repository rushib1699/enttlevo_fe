import React, { useState, useEffect } from "react";
import {
    Box,
    CircularProgress,
    Chip,
    Divider,
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

interface Invoice {
    Id: string;
    DocNumber: string;
    CustomerRef: {
        value: string;
        name: string;
    };
    TotalAmt: number;
    DueDate: string;
    Balance: number;
    Line: Array<{
        Id?: string;
        LineNum?: number;
        Description?: string;
        Amount: number;
        DetailType: string;
        SalesItemLineDetail?: {
            ItemRef: {
                value: string;
                name: string;
            };
            UnitPrice: number;
            Qty: number;
            TaxCodeRef: {
                value: string;
            };
        };
        SubTotalLineDetail?: Record<string, never>;
    }>;
    BillAddr: {
        Id: string;
        Line1: string;
        City: string;
        Country: string;
        CountrySubDivisionCode: string;
        PostalCode: string;
    };
    ShipAddr: {
        Id: string;
        Line1: string;
        City: string;
        Country: string;
        CountrySubDivisionCode: string;
        PostalCode: string;
    };
    TxnTaxDetail: {
        TotalTax: number;
        TaxLine: Array<{
            Amount: number;
            DetailType: string;
            TaxLineDetail: {
                TaxRateRef: {
                    value: string;
                };
                PercentBased: boolean;
                TaxPercent: number;
                NetAmountTaxable: number;
            };
        }>;
    };
    CurrencyRef: {
        value: string;
        name: string;
    };
    TxnDate: string;
    GlobalTaxCalculation: string;
    PrintStatus: string;
    EmailStatus: string;
    BillEmail?: {
        Address: string;
    };
}

const InvoicesPage: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [openSheet, setOpenSheet] = useState(false);
    const [loading, setLoading] = useState(true);
    const [customerFilter, setCustomerFilter] = useState("");
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);

    const resetFilters = () => {
        setCustomerFilter("");
        setStartDate(undefined);
        setEndDate(undefined);
    };

    useEffect(() => {
        const fetchInvoices = async () => {
            try {
                const response = await fetch(
                    "https://x3kb-thkl-gi2q.n7e.xano.io/api:kMX7vBDb/all_invoices?tenant_id=14&type=prod"
                );
                const data = await response.json();
                setInvoices(data.QueryResponse.Invoice || []);
            } catch (error) {
                console.error("Error fetching invoices:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoices();
    }, []);

    const columns: GridColDef[] = [
        { field: "DocNumber", headerName: "Invoice #", flex: 1 },
        { field: "Customer", headerName: "Customer", flex: 1 },
        {
            field: "TotalAmt",
            headerName: "Amount",
            flex: 1,
            renderCell: (params) =>
                `${params.row.fullData.CurrencyRef.value} ${params.value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`,
        },
        {
            field: "TxnDate",
            headerName: "Invoice Date",
            flex: 1,
            renderCell: (params) =>
                new Date(params.row.fullData.TxnDate).toLocaleDateString(),
        },
        {
            field: "DueDate",
            headerName: "Due Date",
            flex: 1,
            renderCell: (params) =>
                new Date(params.value).toLocaleDateString(),
        },
        {
            field: "Status",
            headerName: "Status",
            flex: 1,
            renderCell: (params) =>
                params.row.Balance > 0 ? (
                    <Chip label="Unpaid" color="error" size="small" />
                ) : (
                    <Chip label="Paid" color="success" size="small" />
                ),
        },
    ];

    const filteredRows = invoices
        .filter(inv => {
            const matchesCustomer = inv.CustomerRef.name.toLowerCase().includes(customerFilter.toLowerCase());
            const invoiceDate = new Date(inv.TxnDate);
            const matchesDateRange = (!startDate || invoiceDate >= startDate) &&
                (!endDate || invoiceDate <= endDate);
            return matchesCustomer && matchesDateRange;
        })
        .map((inv) => ({
            id: inv.Id,
            DocNumber: inv.DocNumber,
            Customer: inv.CustomerRef.name,
            TotalAmt: inv.TotalAmt,
            DueDate: inv.DueDate,
            Balance: inv.Balance,
            TxnDate: inv.TxnDate,
            fullData: inv,
        }));

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
                <h1 className="text-2xl font-bold">Invoices</h1>
                <Button variant="outline" onClick={resetFilters}>
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    Reset Filters
                </Button>
            </div>

            <div className="flex gap-4  p-2 w-full">
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
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    disableRowSelectionOnClick
                    onRowClick={(params) => {
                        setSelectedInvoice(params.row.fullData);
                        setOpenSheet(true);
                    }}
                />
            </Box>

            {/* Invoice Sheet */}
            <Sheet open={openSheet} onOpenChange={setOpenSheet}>
                <SheetContent className="sm:max-w-[1000px] h-screen p-8 overflow-y-auto">
                    {selectedInvoice && (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-bold">INVOICE</h3>
                                <div className="text-right space-y-1">
                                    <p>Invoice #: {selectedInvoice.DocNumber}</p>
                                    <p>Invoice Date: {new Date(selectedInvoice.TxnDate).toLocaleDateString()}</p>
                                    <p>Due Date: {new Date(selectedInvoice.DueDate).toLocaleDateString()}</p>
                                    <p>Currency: {selectedInvoice.CurrencyRef.name}</p>
                                </div>
                            </div>

                            <Divider className="my-4" />

                            {/* Billing Info */}
                            <div className="flex justify-between mb-6">
                                <div className="space-y-1">
                                    <p className="font-bold">Bill To:</p>
                                    <p>{selectedInvoice.CustomerRef.name}</p>
                                    <p>{selectedInvoice.BillAddr.Line1}</p>
                                    <p>{selectedInvoice.BillAddr.City}, {selectedInvoice.BillAddr.CountrySubDivisionCode}</p>
                                    <p>{selectedInvoice.BillAddr.PostalCode}</p>
                                    <p>{selectedInvoice.BillAddr.Country}</p>
                                    {selectedInvoice.BillEmail && (
                                        <p>Email: {selectedInvoice.BillEmail.Address}</p>
                                    )}
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="font-bold">Ship To:</p>
                                    <p>{selectedInvoice.CustomerRef.name}</p>
                                    <p>{selectedInvoice.ShipAddr.Line1}</p>
                                    <p>{selectedInvoice.ShipAddr.City}, {selectedInvoice.ShipAddr.CountrySubDivisionCode}</p>
                                    <p>{selectedInvoice.ShipAddr.PostalCode}</p>
                                    <p>{selectedInvoice.ShipAddr.Country}</p>
                                    {selectedInvoice.BillEmail && (
                                        <p>Email: {selectedInvoice.BillEmail.Address}</p>
                                    )}
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
                                        {selectedInvoice.Line.map((item, index) =>
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
                                                            ? `${selectedInvoice.CurrencyRef.value} ${item.SalesItemLineDetail.UnitPrice.toFixed(2)}`
                                                            : "-"
                                                        }
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid #e0e0e0' }}>{selectedInvoice.CurrencyRef.value} {item.Amount.toFixed(2)}</TableCell>
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
                                        <span>{selectedInvoice.CurrencyRef.value} {(selectedInvoice.TotalAmt - selectedInvoice.TxnTaxDetail.TotalTax).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax ({selectedInvoice.TxnTaxDetail.TaxLine[0]?.TaxLineDetail.TaxPercent}%):</span>
                                        <span>{selectedInvoice.CurrencyRef.value} {selectedInvoice.TxnTaxDetail.TotalTax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total:</span>
                                        <span>{selectedInvoice.CurrencyRef.value} {selectedInvoice.TotalAmt.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-bold">Balance Due:</span>
                                        <span className="text-destructive font-bold">
                                            {selectedInvoice.CurrencyRef.value} {selectedInvoice.Balance.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <Divider className="my-4" />
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default InvoicesPage;
