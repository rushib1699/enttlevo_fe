import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

interface SentimentData {
  sentiment: string;
  percentage: number;
}

const SentimentAnalysisGraph = ({ sentimentAnalysis }: { sentimentAnalysis: SentimentData[] }) => {
  const [graphData, setGraphData] = useState<SentimentData[]>([]);

  useEffect(() => {
    setGraphData(sentimentAnalysis);
  }, [sentimentAnalysis]);

  return (
    <div className="flex gap-8 justify-center items-center p-6">
      {graphData && graphData.map((data) => (
        <div key={data.sentiment} className="flex flex-col gap-4 items-center w-32">
          <div className="relative flex items-center justify-center">
            <Progress 
              value={data.percentage} 
              className="h-24 w-24" 
              indicatorClassName="bg-orange-500"
            />
            <span className="absolute text-lg font-medium">
              {data.percentage}%
            </span>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {data.sentiment}
          </span>
        </div>
      ))}
    </div>
  );
};

export default SentimentAnalysisGraph;
