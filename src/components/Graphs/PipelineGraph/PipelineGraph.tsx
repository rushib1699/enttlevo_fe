import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { LeadOCData } from '@/types';
import NoDataMessage from '../NoDataMessage';

// Register all Chart.js components
Chart.register(...registerables);

type Props = {
  graphData: LeadOCData[];
};

const PipelineGraph: React.FC<Props> = ({ graphData }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    // Clean up function to destroy previous chart instance
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!graphData || graphData.length === 0 || !chartRef.current) {
      return;
    }

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    if (!ctx) return;

    // Extract data for the chart
    const labels = graphData.map(item => item.month);
    const openLeadsData = graphData.map(item => item.open_leads);
    const closedLeadsData = graphData.map(item => item.closed_leads);

    // Create new chart instance
    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Open Leads',
            data: openLeadsData,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
          {
            label: 'Closed Leads',
            data: closedLeadsData,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 6,
            barPercentage: 0.7,
            categoryPercentage: 0.8
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            title: {
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: 500
              }
            },
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              padding: 15,
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: 500
              },
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1f2937',
            bodyColor: '#4b5563',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: {
              size: 13,
              weight: 600
            },
            bodyFont: {
              size: 12
            },
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return `${label}: ${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            border: {
              color: '#e5e7eb'
            },
            ticks: {
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: 500
              },
              color: '#6b7280',
              padding: 8
            }
          },
          y: {
            beginAtZero: true,
            border: {
              display: false
            },
            grid: {
              color: '#f3f4f6',
              border: false,
              drawTicks: false
            },
            ticks: {
              precision: 0,
              font: {
                family: "'Inter', sans-serif",
                size: 12,
                weight: 500
              },
              color: '#6b7280',
              padding: 8,
              callback: function(value) {
                return value.toLocaleString();
              }
            }
          }
        },
        animation: {
          duration: 750,
          easing: 'easeOutQuart'
        },
        layout: {
          padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    });

  }, [graphData]);

  if (!graphData || graphData.length === 0) {
    return <div className="h-[300px]"><NoDataMessage /></div>;
  }

  return (
    <div className="w-full h-auto">
      <canvas ref={chartRef} className="w-full h-auto" />
    </div>
  );
};

export default PipelineGraph;