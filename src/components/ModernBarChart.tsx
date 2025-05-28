import React from 'react';
import { useExecuteQueryByWidgetId } from '@sisense/sdk-ui';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModernBarChartProps {
  dashboardOid: string;
  widgetOid: string;
  title: string;
}

// Function to generate pastel colors - will repeat but necessary for many series
const getPastelColor = (index: number): string => {
  const transparency = '0.7'; // 70% opacity
  const colors = [
    `rgba(179, 229, 252, ${transparency})`, `rgba(179, 205, 224, ${transparency})`,
    `rgba(200, 230, 201, ${transparency})`, `rgba(255, 224, 178, ${transparency})`,
    `rgba(255, 205, 210, ${transparency})`, `rgba(225, 190, 231, ${transparency})`,
    `rgba(178, 235, 242, ${transparency})`, `rgba(207, 216, 220, ${transparency})`,
    `rgba(255, 236, 179, ${transparency})`, `rgba(205, 220, 57, ${transparency})`,
    `rgba(129, 212, 250, ${transparency})`, `rgba(244, 143, 177, ${transparency})`,
  ];
  return colors[index % colors.length];
};

const ModernBarChart: React.FC<ModernBarChartProps> = ({ dashboardOid, widgetOid, title }) => {
  const { data: sisenseSDKData, isLoading, isError, error } = useExecuteQueryByWidgetId({
    widgetOid: widgetOid,
    dashboardOid: dashboardOid,
  });

  console.log(`[${title}] Hook Status:`, { isLoading, isError, error, sisenseSDKData });

  // *** MAJOR CHANGES HERE: Process data for STACKED Chart.js ***
  const chartData: ChartData<'bar'> | null = React.useMemo(() => {
    if (!sisenseSDKData || !sisenseSDKData.rows || sisenseSDKData.rows.length === 0) {
      return null;
    }

    const rows = sisenseSDKData.rows as any[];
    console.log(`[${title}] First Sisense row for stacking:`, rows[0]);

    const industriesSet = new Set<string>();
    const accountsSet = new Set<string>();
    const dataMap = new Map<string, Map<string, number>>(); // Map<Industry, Map<Account, Value>>

    let industryKey = 'Industry'; // Default/Guess
    let accountKey = 'Account';   // Default/Guess
    let valueKey = 'Count';     // Default/Guess

    // Try to find actual keys from the first row
    if (rows.length > 0) {
        const firstRow = rows[0];
        const keys = Object.keys(firstRow);
        industryKey = keys.find(k => k.toLowerCase().includes('industry')) || keys[0]; // Guess first string column
        accountKey = keys.find(k => k.toLowerCase().includes('account') || k.toLowerCase().includes('company')) || keys[1]; // Guess second string column
        valueKey = keys.find(k => typeof firstRow[k].data === 'number') || keys[2]; // Guess first number column
        console.log(`[${title}] Using Keys: Industry='${industryKey}', Account='${accountKey}', Value='${valueKey}'`);
    }

    // Populate sets and the data map
    rows.forEach(row => {
      const industry = row[industryKey]?.text;
      const account = row[accountKey]?.text;
      const value = row[valueKey]?.data;

      if (industry && account && typeof value === 'number') {
        industriesSet.add(industry);
        accountsSet.add(account);

        if (!dataMap.has(industry)) {
          dataMap.set(industry, new Map<string, number>());
        }
        dataMap.get(industry)?.set(account, value);
      }
    });

    const industryLabels = Array.from(industriesSet);
    const accountLabels = Array.from(accountsSet);

    if (industryLabels.length === 0 || accountLabels.length === 0) return null;

    // Create a dataset for each account
    const datasets = accountLabels.map((account, index) => {
      const dataForThisAccount = industryLabels.map(industry => {
        return dataMap.get(industry)?.get(account) || 0; // Get value or 0
      });

      return {
        label: account, // Each company is a dataset
        data: dataForThisAccount,
        backgroundColor: getPastelColor(index),
        borderRadius: 5, // Slightly round each segment
        borderSkipped: false,
        stack: 'a', // All datasets belong to the same stack
      };
    });

    return {
      labels: industryLabels,
      datasets: datasets,
    };
  }, [sisenseSDKData]);

  // *** CHANGES HERE: Update options for STACKED Chart ***
  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // *** HIDE THE LEGEND - Too many items! ***
      },
      title: {
        display: true,
        text: title,
        color: '#FFFFFF',
      },
      tooltip: { // Tooltip will show company and value
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.x !== null) {
                    label += new Intl.NumberFormat().format(context.parsed.x);
                }
                return label;
            }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#FFFFFF' },
        stacked: true, // *** ENABLE STACKING ***
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: '#FFFFFF' },
        stacked: true, // *** ENABLE STACKING ***
      },
    },
  };

  // *** CHANGES HERE: Calculate dynamic height and add wrapper ***
  const numberOfIndustries = chartData?.labels?.length || 1;
  const barHeight = 60; // Adjust this value to make bars thicker/thinner
  const chartHeight = Math.max(400, numberOfIndustries * barHeight); // Min height 400px

  return (
    // Add a wrapper div for styling and the outer scroll container
    <div className="modern-widget-container-stacked">
        {/* This div will handle scrolling */}
        <div className="modern-chart-scroll-area">
            {/* This inner div will hold the chart and have the dynamic height */}
            <div style={{ height: `${chartHeight}px`, position: 'relative' }}>
                {isLoading && <div className="chart-message">Loading Chart...</div>}
                {isError && <div className="chart-message error">Error: {error instanceof Error ? error.message : 'Unknown Error'}</div>}
                {!isLoading && !isError && !chartData && <div className="chart-message">No data to display.</div>}
                {chartData && !isLoading && !isError && <Bar options={options} data={chartData} />}
            </div>
        </div>
    </div>
  );
};

export default ModernBarChart;