import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { PhaseWiseRevenue } from "@/types";
import NoDataMessage from "@/components/Graphs/NoDataMessage";

// Register Chart.js components
Chart.register(...registerables);

interface Props {
  phaseWiseRevenueData: PhaseWiseRevenue[];
}

const COLORS = [
  "#0088FE",
  "#00C49F", 
  "#FFBB28",
  "#00A1E4",
  "#2EC4B6",
  "#FFB703",
];

const RevenuePhaseWise: React.FC<Props> = ({ phaseWiseRevenueData }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Calculate total and color mapping
  const { TOTAL, getColorForPhase } = useMemo(() => {
    if (!phaseWiseRevenueData?.length) {
      return {
        TOTAL: 0,
        getColorForPhase: () => COLORS[0]
      };
    }

    const total = phaseWiseRevenueData.reduce((sum, item) => sum + item.total_mrr, 0);

    const getColor = (phase: string) => {
      const index = phaseWiseRevenueData.findIndex(item => item.phase === phase);
      return COLORS[index % COLORS.length];
    };

    return {
      TOTAL: total,
      getColorForPhase: getColor
    };
  }, [phaseWiseRevenueData]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !phaseWiseRevenueData?.length) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare chart data
    const chartData = {
      labels: phaseWiseRevenueData.map(item => `Phase ${item.phase}`),
      datasets: [{
        data: phaseWiseRevenueData.map(item => item.total_mrr),
        backgroundColor: phaseWiseRevenueData.map(item => getColorForPhase(item.phase)),
        borderWidth: 1,
        hoverOffset: 8
      }]
    };

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        layout: {
          padding: 10
        },
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                size: 11,
                weight: 500
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 10,
              color: '#475569',
              generateLabels: (chart) => {
                if (!chart.data.labels?.length) return [];
                
                return chart.data.labels.map((label, i) => {
                  const value = chart.data.datasets[0].data[i] as number;
                  const percentage = ((value / TOTAL) * 100).toFixed(1);
                  const bgColor = chart.data.datasets[0].backgroundColor as string[];
                  
                  return {
                    text: `${label} (${percentage}%)`,
                    fillStyle: bgColor[i],
                    strokeStyle: bgColor[i],
                    lineWidth: 1,
                    hidden: false,
                    index: i,
                    pointStyle: 'circle'
                  };
                });
              }
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1,
            padding: 8,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const percentage = ((value / TOTAL) * 100).toFixed(1);
                const formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(value);
                return `${context.label}: ${formattedValue} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    });
  }, [phaseWiseRevenueData, TOTAL, getColorForPhase]);

  if (!phaseWiseRevenueData?.length) {
    return (
      <div className="h-[40vh] flex items-center justify-center">
        <NoDataMessage />
      </div>
    );
  }

  return (
    <div className="relative h-80 w-full">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-slate-700">
          Phase Wise Revenue
        </h3>
      </div>
      <div className="w-full h-72">
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default RevenuePhaseWise;
