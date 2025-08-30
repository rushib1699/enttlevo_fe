import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface MRRTierData {
  mrrTier: string;
  count: number;
  totalMRR: number;
  percentage: string;
}

const MRRTierSplitGraph = ({ mrrTierSplit }: { mrrTierSplit: MRRTierData[] | null }) => {
  const [graphData, setGraphData] = useState<MRRTierData[]>([]);

  useEffect(() => {
    if (mrrTierSplit) {
      setGraphData(mrrTierSplit);
    }
  }, [mrrTierSplit]);

  if (!graphData || graphData.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-8 justify-center items-center p-6">
      {graphData.map((item) => (
        <div key={item.mrrTier} className="flex flex-col gap-4 items-center w-32">
          <div className="relative flex items-center justify-center">
            <Progress 
              value={parseFloat(item.percentage)} 
              className="h-24 w-24"
            />
            <span className="absolute text-lg font-medium">
              {item.percentage}%
            </span>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {item.mrrTier}
          </span>
        </div>
      ))}
    </div>
  );
};

export default MRRTierSplitGraph;
