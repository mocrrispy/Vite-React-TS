import React from 'react';
import { Chart } from '@sisense/sdk-ui';
import type { ChartProps } from '@sisense/sdk-ui';

// Define the props our component will accept
interface SisenseWidgetProps {
  dashboardId: string;
  widgetId: string;
  title: string;
}

const SisenseWidget: React.FC<SisenseWidgetProps> = ({ dashboardId, widgetId, title }) => {

  // Optional: Define chart options if needed
  const chartOptions: ChartProps['options'] = {
    // e.g., showToolbar: false
  };

  return (
    // Style the container for size
    <div style={{ width: '600px', height: '400px', margin: '20px', border: '1px solid #ccc', padding: '10px' }}>
      <h3>{title}</h3>
      <Chart
        widgetOid={widgetId}        // Pass the widget ID
        dashboardOid={dashboardId}  // Pass the dashboard ID
        options={chartOptions}      // Pass any options
        // You can also add 'filters' here if needed
      />
    </div>
  );
};

export default SisenseWidget; // Make sure to export the component!