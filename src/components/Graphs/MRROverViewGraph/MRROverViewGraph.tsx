import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import NoDataMessage from '../NoDataMessage';

interface MRROverviewItem {
  industry: string;
  industryMRR: number;
  industryCount: number;
  totalCompanyMRR: number;
  percentage: string;
}

// Updated color mapping for the new industries
const COLORS_MAP: { [key: string]: string } = {
  Software: '#FF8000',
  EV: '#474258',
};

const MRROverViewGraph = ({ mrrOverview }: { mrrOverview: MRROverviewItem[] | null }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !mrrOverview) return;

    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const labels = mrrOverview.map(item => item.industry);
    const data = mrrOverview.map(item => item.industryMRR);
    const colors = mrrOverview.map(item => COLORS_MAP[item.industry] || '#000000');

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 1,
          spacing: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(0);
                return `${context.label}: ${percentage}%`;
              }
            }
          }
        },
        cutout: '60%'
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [mrrOverview]);

  if (!mrrOverview || mrrOverview.length === 0) {
    return <NoDataMessage />;
  }

  return (
    <div className="flex gap-8 justify-center items-center p-6">
      <canvas ref={chartRef} />
    </div>
  );
};

export default MRROverViewGraph;
