// src/components/DashboardItem.tsx
import React, { useMemo } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Colors
} from 'chart.js';
import type { ChartOptions } from 'chart.js'; // Import ChartOptions
import type { AccountRow } from '../App';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, Colors
);

// --- NEW: Simplified Props ---
interface DashboardItemProps {
  title: string;
  type: string;
  allData: AccountRow[];
  isLoading: boolean;
  // id, onRemove, and isLayoutEditable removed as they are handled by App.tsx
}

// Use Sisense Secondary Colors
const SISENSE_CHART_COLORS = [
  'rgba(29, 228, 235, 0.8)',  // Cyan (#1DE4EB)
  'rgba(215, 247, 125, 0.8)', // Green (#D7F77D)
  'rgba(240, 89, 89, 0.8)',   // Red (#F05959)
  'rgba(148, 245, 240, 0.8)', // Light Cyan (#94F5F0)
  'rgba(88, 166, 255, 0.8)',  // Accent Blue (Kept for variety)
  'rgba(250, 171, 76, 0.8)',  // Orange (Kept for variety)
];

// Updated Common Chart Options for Sisense Theme
const commonChartOptions = (titleText: string) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: '#FFFFFF',
        font: {
          family: "'DM Sans', sans-serif",
          size: 12,
        },
        padding: 20,
      },
    },
    title: {
      display: !!titleText,
      text: titleText,
      color: '#FFFFFF',
      font: {
        family: "'Poppins', sans-serif",
        size: 16,
        weight: 600, // --- FIX: Use number 600 instead of string '600' ---
      },
      padding: {
        top: 10,
        bottom: 15,
      }
    },
    tooltip: {
      backgroundColor: '#131F29',
      titleColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      borderColor: '#304560',
      borderWidth: 1,
      padding: 10,
      cornerRadius: 4,
      titleFont: { family: "'Poppins', sans-serif" },
      bodyFont: { family: "'DM Sans', sans-serif" },
    },
  },
  scales: {
    x: {
      ticks: { color: '#A0B0C0', font: { family: "'DM Sans', sans-serif" } },
      grid: { color: '#304560', borderColor: '#304560' },
    },
    y: {
      ticks: { color: '#A0B0C0', font: { family: "'DM Sans', sans-serif" } },
      grid: { color: '#304560', borderColor: '#304560' },
    },
  },
});

// --- NEW: Simplified Component Definition ---
const DashboardItem: React.FC<DashboardItemProps> = ({ title, type, allData, isLoading }) => {
  const chartComponent = useMemo(() => {
    if (!allData || allData.length === 0) {
      return <p className="chart-data-message">No data available for this widget.</p>;
    }

    switch (type) {
      case 'INDUSTRY_BAR_CHART': {
        const industryCounts: { [key: string]: number } = {};
        allData.forEach(row => {
          if (row.industry && row.industry !== 'N/A') {
            industryCounts[row.industry] = (industryCounts[row.industry] || 0) + 1;
          }
        });
        const chartData = {
          labels: Object.keys(industryCounts),
          datasets: [{
            label: 'Number of Accounts',
            data: Object.values(industryCounts),
            backgroundColor: SISENSE_CHART_COLORS.slice(0, Object.keys(industryCounts).length),
            borderColor: SISENSE_CHART_COLORS.map(color => color.replace('0.8', '1')),
            borderWidth: 1,
            borderRadius: 4,
          }],
        };
        // --- FIX: Explicitly cast options for Bar chart ---
        const options: ChartOptions<'bar'> = {
            ...commonChartOptions('Accounts per Industry'),
            // Add any Bar-specific options here if needed
        };
        return <div className="chart-container"><Bar options={options} data={chartData} /></div>;
      }

      case 'EMPLOYEE_PIE_CHART': {
        const segments = { SMB: 0, MidMarket: 0, Enterprise: 0, Unknown: 0 };
        allData.forEach(row => {
          if (row.employees === null) segments.Unknown++;
          else if (row.employees <= 200) segments.SMB++;
          else if (row.employees <= 999) segments.MidMarket++;
          else segments.Enterprise++;
        });
        const chartData = {
          labels: ['SMB (<=200)', 'Mid-Market (201-999)', 'Enterprise (1000+)', 'Unknown'],
          datasets: [{
            data: [segments.SMB, segments.MidMarket, segments.Enterprise, segments.Unknown],
            backgroundColor: [SISENSE_CHART_COLORS[0], SISENSE_CHART_COLORS[1], SISENSE_CHART_COLORS[2], '#A0B0C0'],
            borderColor: '#1A2B3C',
            borderWidth: 2,
            hoverOffset: 8,
          }],
        };
        // --- FIX: Explicitly cast options for Pie chart ---
        const options: ChartOptions<'pie'> = {
            ...commonChartOptions('Account Distribution by Employee Segment'),
            scales: undefined // Pie charts don't use scales, setting to undefined helps TypeScript
        };
        return <div className="chart-container"><Pie options={options} data={chartData} /></div>;
      }

      case 'KPI_TOTAL_ACCOUNTS': {
        return (
          <div className="kpi-container">
            <h2>{allData.length}</h2>
            <p>Total Accounts</p>
          </div>
        );
      }

      default:
        return <p className="chart-data-message">Widget type "{type}" not yet implemented.</p>;
    }
  }, [type, allData]); // Removed title as it's static in options

  if (isLoading && (!allData || allData.length === 0)) {
    return (
      <div className="dashboard-item">
        <div className="dashboard-item-content"><div className="table-message">Loading Widget Data...</div></div>
      </div>
    );
  }

  return (
    <div className="dashboard-item">
      <div className="dashboard-item-content">
        {chartComponent}
      </div>
    </div>
  );
};

export default DashboardItem;