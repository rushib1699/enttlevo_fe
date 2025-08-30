import React, { useCallback, useEffect, useState } from 'react'
import { getRevenuePhaseWise, getTimeToOnboardGraph } from "@/api";
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { PhaseWiseRevenue, getTimeToOnboardTypes } from '@/types';
import { useUserPermission } from "@/context/UserPermissionContext";
import RevenuePhaseWise from "@/components/Graphs/RevenuePhaseWiseGraph/RevenuePhaseWise";
import TimeToOnboard from "@/components/Graphs/TimeToOnboard/TimeToOnboard";
import { Card, CardContent } from "@/components/ui/card";
import DatePicker from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const OBReportsPage: React.FC = () => {
  const { hasAccess } = useUserPermission();
  const { loginResponse } = useApplicationContext();
  const [phaseWiseRevenue, setPhaseWiseRevenue] = useState<PhaseWiseRevenue[]>([]);
  const [timeToOnboard, setTimeToOnboard] = useState<getTimeToOnboardTypes[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const hasReportPermission = hasAccess('report')
  const isSuperAdmin = hasAccess("superadmin");
  
  const fetchPhaseWiseRevenue = useCallback(async () => {
    if (loginResponse) {
      try {
        let payload = {
          user_id: Number(loginResponse?.id),
          role: Number(loginResponse?.role_id),
          company_id: Number(loginResponse?.company_id),
        };
        const response = await getRevenuePhaseWise(payload);
        setPhaseWiseRevenue(response);
      } catch (e) {
        console.log("Error fetching phase wise revenue data: ", e);
      }
    }
  }, [loginResponse]);

  const fetchTimeToOnboard = useCallback(async () => {
    if (loginResponse) {
      setLoading(true);

      const today = new Date();
      const oneMonthsAgo = new Date(
        today.getFullYear(),
        today.getMonth() - 3,
        today.getDate()
      );
      
      const formattedStartDate = startDate 
        ? format(startDate, 'yyyy-MM-dd')
        : format(oneMonthsAgo, 'yyyy-MM-dd');
        
      const formattedEndDate = endDate 
        ? format(endDate, 'yyyy-MM-dd')
        : format(today, 'yyyy-MM-dd');

      try {
        const response = await getTimeToOnboardGraph({
          user_id: Number(loginResponse?.id),
          role: Number(loginResponse?.role_id),
          company_id: Number(loginResponse?.company_id),
          start_date: formattedStartDate,
          end_date: formattedEndDate,
        });
        setTimeToOnboard(response);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    }
  }, [loginResponse, startDate, endDate]);

  useEffect(() => {
    if (hasReportPermission) {
      fetchPhaseWiseRevenue();
      fetchTimeToOnboard();
    }
  }, [hasReportPermission]);

  const handleApplyFilter = () => {
    fetchTimeToOnboard();
  };

  return (
    <div className="space-y-4">
      {(hasReportPermission || isSuperAdmin) && (
        <>
          <div className="flex items-center gap-4">
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              placeholder="Start Date"
            />
            <DatePicker
              date={endDate}
              setDate={setEndDate}
              
            />
            <Button onClick={handleApplyFilter}>Apply Filter</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-fit rounded-lg">
              <CardContent className="p-4">
                <RevenuePhaseWise phaseWiseRevenueData={phaseWiseRevenue} />
              </CardContent>
            </Card>
            <Card className="h-fit rounded-lg">
              <CardContent className="p-4">
                <TimeToOnboard TimeToOnboardData={timeToOnboard} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

export default OBReportsPage