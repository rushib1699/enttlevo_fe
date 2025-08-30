import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import NoDataMessage from "@/components/Graphs/NoDataMessage";

// Register Chart.js components
Chart.register(...registerables);

// Define the type for the data prop
interface DataItem {
  ob_manager: string;
  onboarding_manager: number;
  average_days_to_transfer: number;
}

interface TimeToOnboardProps {
  TimeToOnboardData: DataItem[];
}

const TimeToOnboard: React.FC<TimeToOnboardProps> = ({ TimeToOnboardData }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Cleanup previous chart instance
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Transform the data
    const labels = TimeToOnboardData.map(item => item.ob_manager);
    const onboardingManagerData = TimeToOnboardData.map(item => item.onboarding_manager);
    const avgDaysData = TimeToOnboardData.map(item => item.average_days_to_transfer);

    // Create new chart
    chartInstance.current = new Chart(chartRef.current, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Onboarding Manager',
            data: onboardingManagerData,
            backgroundColor: '#413ea0',
            order: 2
          },
          {
            label: 'Average Days to Transfer',
            data: avgDaysData,
            type: 'line',
            borderColor: '#ff7300',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#f5f5f5'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [TimeToOnboardData]);

  // If there is no data, display a message
  if (!TimeToOnboardData || TimeToOnboardData.length === 0) {
    return <div className="h-[40vh]"><NoDataMessage /></div>;
  }

  return (
    <div className="col-span-1 row-span-1 overflow-hidden bg-slate-100/50 shadow-md flex flex-col rounded-md relative p-4">
      <div className="mb-4">
        <p className="text-lg text-slate-600 font-semibold">
          Time To Onboard
        </p>
      </div>
      <div className="flex items-center justify-center h-[290px]">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default TimeToOnboard;
