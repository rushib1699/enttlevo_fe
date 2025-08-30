import React, { useEffect, useRef, useMemo } from "react";
import { Chart, registerables, ChartEvent } from 'chart.js';
import NoDataMessage from "../NoDataMessage";

// Register Chart.js components
Chart.register(...registerables);

interface DataItem {
  funnel_id: number;
  funnel_stage: string;
  count: number;
}

interface Props {
  dealConversionData: DataItem[];
}

// Move constants outside component
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const DealConversionGraph: React.FC<Props> = ({ dealConversionData }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Calculate total using useMemo
  const total = useMemo(() => {
    if (!dealConversionData || dealConversionData.length === 0) return 0;
    return dealConversionData.reduce((sum, item) => sum + item.count, 0);
  }, [dealConversionData]);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !dealConversionData || dealConversionData.length === 0) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Create new chart instance
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: dealConversionData.map(item => item.funnel_stage),
        datasets: [{
          data: dealConversionData.map(item => item.count),
          backgroundColor: dealConversionData.map((_, index) => COLORS[index % COLORS.length]),
          borderColor: dealConversionData.map((_, index) => COLORS[index % COLORS.length]),
          borderWidth: 1,
          hoverOffset: 10,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        layout: {
          padding: 20
        },
        plugins: {
          legend: {
            display: true,
            position: 'right',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                size: 12
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15,
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels && data.datasets) {
                  return data.labels.map((label, index) => ({
                    text: `${label} (${data.datasets[0].data[index]})`,
                    fillStyle: COLORS[index % COLORS.length],
                    strokeStyle: COLORS[index % COLORS.length],
                    lineWidth: 1,
                    hidden: false,
                    index: index,
                    pointStyle: 'circle'
                  }));
                }
                return [];
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
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const value = context.raw as number;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              }
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true
        },
        hover: {
          mode: 'nearest',
          intersect: true
        },
        onClick: (event: ChartEvent, elements: any[]) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            // Handle click event if needed
            console.log("Clicked segment:", dealConversionData[index]);
          }
        }
      }
    });
  }, [dealConversionData, total]);

  // Move conditional return after all hooks
  if (!dealConversionData || dealConversionData.length === 0) {
    return <div className="h-[40vh]"><NoDataMessage /></div>;
  }

  return (
    <div className="w-full h-auto flex items-center justify-center">
      <canvas ref={chartRef} />
    </div>
  );
};

export default DealConversionGraph;