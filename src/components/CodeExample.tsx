import { useExecuteQueryByWidgetId } from '@sisense/sdk-ui';
import React from 'react';

// 1. Define an interface for the props we expect
interface CodeExampleProps {
  dashboardOid: string;
  widgetOid: string;
  title: string;
}

// 2. Update the component to accept and use these props
const CodeExample: React.FC<CodeExampleProps> = ({ dashboardOid, widgetOid, title }) => {

  // 3. Use the props in the hook
  const { data, isLoading, isError, error } = useExecuteQueryByWidgetId({
    widgetOid: widgetOid,    // Use prop
    dashboardOid: dashboardOid, // Use prop
  });

  return (
    <div style={{ margin: '20px', padding: '10px', border: '1px solid lightblue' }}>
      {/* 4. Use the title prop */}
      <h2>{title}</h2>

      {isLoading && <div>Loading data...</div>}

      {isError && (
        <div>
          Error: {error instanceof Error ? error.message : 'An unknown error occurred'}
        </div>
      )}

      {data && (
        <div>
          <p>Data Hook - Total Rows: {data.rows.length}</p>
          {/* You can add more rendering logic here! 
            For example, map over data.rows to display them:
            <ul>
              {data.rows.map((row, index) => (
                <li key={index}>{JSON.stringify(row.data)}</li>
              ))}
            </ul>
          */}
          <pre style={{ fontSize: '10px', background: '#f4f4f4', padding: '5px', maxHeight: '100px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {!isLoading && !isError && !data && <div>No data received.</div>}
    </div>
  );
};

export default CodeExample;