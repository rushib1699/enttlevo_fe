import React ,{useState, useEffect}from 'react'
import { getSentimentAnalysis, getMrrTierSplit, getMrrOverview } from '@/api'
import { useApplicationContext } from "@/hooks/useApplicationContext";
import SentimentAnalysisGraph from '@/components/Graphs/SentimentAnalysisGraph/SentimentAnalysisGraph';
import MrrTierSplitGraph from '@/components/Graphs/MRRTierSplitGraph/MRRTierSplitGraph';
import MrrOverviewGraph from '@/components/Graphs/MRROverViewGraph/MRROverViewGraph';


const AMReportsPage = () => {
  const { loginResponse } = useApplicationContext();
  const [sentimentAnalysisData, setSentimentAnalysisData] = useState<any>(null);
  const [mrrTierSplitData, setMrrTierSplitData] = useState<any>(null);
  const [mrrOverviewData, setMrrOverviewData] = useState<any>(null);


  const getSentimentAnalysisData = async () => {
    try {
      const response = await getSentimentAnalysis({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
      });
      setSentimentAnalysisData(response);
    } catch (error) {
      console.error('Error fetching sentiment analysis data:', error);
    }
  };

  const getMrrTierSplitData = async () => {
    try {
      const response = await getMrrTierSplit({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
      });
      setMrrTierSplitData(response);
    } catch (error) {
      console.error('Error fetching MRR tier split data:', error);
    }
  };

  const getMrrOverviewData = async () => {
    try {
      const response = await getMrrOverview({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
        role_id: loginResponse?.role_id || 0,
      });
      setMrrOverviewData(response);
    } catch (error) {
      console.error('Error fetching MRR overview data:', error);
    }
  };

  useEffect(() => {
    getSentimentAnalysisData();
    getMrrTierSplitData();
    getMrrOverviewData();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border rounded-lg shadow-md">
        <h2 className="text-xl font-semibold p-4">Sentiment Analysis</h2>
        <SentimentAnalysisGraph sentimentAnalysis={sentimentAnalysisData} />
      </div>
      <div className="border rounded-lg shadow-md">
        <h2 className="text-xl font-semibold p-4">MRR Tier Split</h2>
        <MrrTierSplitGraph mrrTierSplit={mrrTierSplitData} />
      </div>
      <div className="border rounded-lg shadow-md col-span-2">
        <h2 className="text-xl font-semibold p-4">MRR Overview</h2>
        <MrrOverviewGraph mrrOverview={mrrOverviewData} />
      </div>
    </div>
  )
}

export default AMReportsPage