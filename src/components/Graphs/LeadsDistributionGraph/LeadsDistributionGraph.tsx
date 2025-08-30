import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';
import { LeadIndustryData } from "@/types";
import NoDataMessage from "../NoDataMessage";
import { scaleOrdinal } from "d3-scale";
import { schemeCategory10 } from "d3-scale-chromatic";

// Register Chart.js components
Chart.register(...registerables);

type Props = {
  graphData: LeadIndustryData[];
};

const LeadsDistributionGraph: React.FC<Props> = ({ graphData }) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Move color generation to useMemo
  const { colors, labels, data } = useMemo(() => {
    if (!graphData || graphData.length === 0) {
      return { colors: [], labels: [], data: [] };
    }

    const industries = graphData.map((entry) => entry.industry);
    const colorScale = scaleOrdinal(schemeCategory10).domain(industries);
    
    const generatedColors = industries.map(industry => colorScale(industry));
    const chartLabels = graphData.map(entry => entry.industry);
    const chartData = graphData.map(entry => entry.total_leads);

    return {
      colors: generatedColors,
      labels: chartLabels,
      data: chartData
    };
  }, [graphData]);

  useEffect(() => {
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !graphData || graphData.length === 0) return;

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
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1,
          spacing: 0,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        layout: {
          padding: {
            left: 20,
            right: 120, // Extra space for legend
            top: 20,
            bottom: 20
          }
        },
        plugins: {
          legend: {
            position: 'right',
            align: 'center',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                size: 12
              },
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 15
            }
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
              label: function(context) {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} (${percentage}%)`;
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
  }, [graphData, colors, labels, data]);

  // Move conditional return after all hooks
  if (!graphData || graphData.length === 0) {
    return <div className="h-[40vh]"><NoDataMessage /></div>;
  }

  return (
    <div className="flex flex-row items-start">
      <div style={{ flex: 1, height: '300px' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
};

export default LeadsDistributionGraph;