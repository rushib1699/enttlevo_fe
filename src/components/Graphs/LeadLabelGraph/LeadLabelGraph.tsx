import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import NoDataMessage from '@/components/Graphs/NoDataMessage';

interface TotalLeads {
  total_hot: number;
  total_warm: number;
  total_cold: number;
}

interface LeadLabelGraphProps {
  leadLabelGraphData: TotalLeads[]
}

const LeadLabelGraph = ({ leadLabelGraphData }: LeadLabelGraphProps) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart>()

  const transformedData = [
    {
      name: 'Hot Leads',
      value: leadLabelGraphData?.[0]?.total_hot ?? 0,
      color: '#ef4444' // Red for hot
    },
    {
      name: 'Warm Leads', 
      value: leadLabelGraphData?.[0]?.total_warm ?? 0,
      color: '#f97316' // Orange for warm
    },
    {
      name: 'Cold Leads',
      value: leadLabelGraphData?.[0]?.total_cold ?? 0,
      color: '#3b82f6' // Blue for cold
    }
  ]

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }

      const ctx = chartRef.current.getContext('2d')
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar', // Changed to bar chart
          data: {
            labels: transformedData.map(d => d.name),
            datasets: [{
              data: transformedData.map(d => d.value),
              backgroundColor: transformedData.map(d => d.color),
              borderWidth: 1,
              borderColor: transformedData.map(d => d.color),
              borderRadius: 5 // Added rounded corners
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false // Removed legend since labels are on x-axis
              },
              tooltip: {
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
                    const total = transformedData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                    return `${context.label}: ${value} (${percentage}%)`;
                  }
                }
              }
            },
            scales: { // Added scales configuration for bar chart
              y: {
                beginAtZero: true,
                ticks: {
                  font: {
                    family: "'Inter', sans-serif",
                    size: 12
                  }
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  font: {
                    family: "'Inter', sans-serif",
                    size: 12
                  }
                }
              }
            }
          }
        })
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [leadLabelGraphData])

  if (!leadLabelGraphData?.[0]) {
    return <div className="h-[40vh]"><NoDataMessage /></div>;
  }

  return (
    <div className="h-[300px] w-full">
      <canvas ref={chartRef} />
    </div>
  )
}

export default LeadLabelGraph