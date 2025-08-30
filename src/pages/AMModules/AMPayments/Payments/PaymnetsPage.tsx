import React, { useState, useEffect } from 'react'
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { getMonthlyPayments , getMonthlyRenewals} from '@/api'
import AMMonthlyPayments from '@/components/Table/AM/AMMonthlyPayments';
import AMMonthlyRenewals from '@/components/Table/AM/AMMonthlyRenewals';
import DatePicker from '@/components/ui/date-picker';
import moment from 'moment';
import { CreditCard, RefreshCw } from 'lucide-react';

const PaymentsPage: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [monthlyPaymentsData, setMonthlyPaymentsData] = useState<any>(null);
  const [monthlyRenewalsData, setMonthlyRenewalsData] = useState<any>(null);
  const [startDate, setStartDate] = useState<Date | null>(moment().subtract(90, "days").toDate());
  const [endDate, setEndDate] = useState<Date | null>(moment().toDate());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('payments');

  const getMonthlyPaymentsData = async () => {
    try {
      setLoading(true);
      const response = await getMonthlyPayments({
        start_date: startDate?.toISOString().split('T')[0] || '2024-01-01',
        end_date: endDate?.toISOString().split('T')[0] || '2024-12-31',
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role: loginResponse?.role_id || 0,
      });
      setMonthlyPaymentsData(response);
    } catch (error) {
      console.error('Error fetching monthly payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthlyRenewalsData = async () => {
    try {
      setLoading(true);
      const response = await getMonthlyRenewals({
        start_date: startDate?.toISOString().split('T')[0] || '2024-01-01',
        end_date: endDate?.toISOString().split('T')[0] || '2024-12-31',
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role: loginResponse?.role_id || 0,
      });
      setMonthlyRenewalsData(response);
    } catch (error) {
      console.error('Error fetching monthly renewals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMonthlyPaymentsData();
    getMonthlyRenewalsData();
  }, [startDate, endDate]);

  if(loading) {
    return <div className="flex items-center justify-center h-[80vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <DatePicker
          date={startDate}
          setDate={(date) => setStartDate(date)}
          placeholder="Start Date"
        />
        <DatePicker
          date={endDate}
          setDate={(date) => setEndDate(date)}
          placeholder="End Date"
        />
      </div>

      <div className="w-full">
        <div className="flex w-auto gap-2 p-1 mb-2 border-b">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
              activeTab === 'payments' 
                ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600' 
                : 'hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Monthly Payments
          </button>
          <button
            onClick={() => setActiveTab('renewals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg ${
              activeTab === 'renewals'
                ? 'bg-orange-50 text-orange-600 border-b-2 border-orange-600'
                : 'hover:bg-gray-100'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Annual Renewals
          </button>
        </div>

        <div className="mt-4">
          {activeTab === 'payments' && (
            <AMMonthlyPayments monthlyPaymentsData={monthlyPaymentsData} />
          )}
          {activeTab === 'renewals' && (
            <AMMonthlyRenewals monthlyRenewalsData={monthlyRenewalsData} />
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentsPage