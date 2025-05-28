// src/components/WidgetLibrary.tsx
import React from 'react';

interface WidgetOption {
  type: string;
  title: string;
  description: string;
  icon?: string; // Added optional icon
}

// Expanded list with slightly more detail for demonstration
const availableWidgets: WidgetOption[] = [
  {
    type: 'INDUSTRY_BAR_CHART',
    title: 'Industry Summary Bar',
    description: 'Compare values across industries.',
    icon: '📊',
  },
  {
    type: 'EMPLOYEE_PIE_CHART',
    title: 'Employee Segments Pie',
    description: 'Visualize accounts by employee size.',
    icon: '🥧',
  },
  {
    type: 'KPI_TOTAL_ACCOUNTS',
    title: 'Total Accounts KPI',
    description: 'Display the total number of accounts.',
    icon: '🔢',
  },
  // --- NEW WIDGET OPTION ---
  {
    type: 'NOTEPAD_WIDGET',
    title: 'Notepad / Tasks',
    description: 'Jot down quick notes and to-do items.',
    icon: '📝',
  },
  // { // Example for future
  //   type: 'REVENUE_TREND_LINE',
  //   title: 'Revenue Trend Line',
  //   description: 'Show annual revenue trends over time.',
  //   icon: '📈',
  // },
];

interface WidgetLibraryProps {
  onAddWidget: (type: string, title: string) => void;
}

const WidgetLibrary: React.FC<WidgetLibraryProps> = ({ onAddWidget }) => {
  return (
    <div className="widget-library-container">
      <h3>Add New Widget</h3>
      <div className="widget-options-grid">
        {availableWidgets.map((widget) => (
          <div key={widget.type} className="widget-card">
            <div className="widget-card-icon-placeholder">
              <span>{widget.icon || '❓'}</span> {/* Use icon or default */}
            </div>
            <div className="widget-card-content">
              <h4 className="widget-card-title">{widget.title}</h4>
              <p className="widget-card-description">{widget.description}</p>
            </div>
            <button
              className="widget-card-add-button"
              onClick={() => onAddWidget(widget.type, widget.title)}
            >
              Add to Dashboard
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WidgetLibrary;