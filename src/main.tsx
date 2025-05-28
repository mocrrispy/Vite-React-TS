// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SisenseContextProvider } from '@sisense/sdk-ui';
// MyCustomSisenseContextProvider is removed
import './index.css';

const sisenseUrlFromEnv = import.meta.env.VITE_SISENSE_URL as string | undefined;
const sisenseTokenFromEnv = import.meta.env.VITE_SISENSE_TOKEN as string | undefined;

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element. Make sure your index.html has <div id='root'></div>.");
}

const root = ReactDOM.createRoot(rootElement);

if (!sisenseUrlFromEnv || !sisenseTokenFromEnv) {
  console.error("CRITICAL ERROR: Sisense URL or Token is MISSING in environment variables (.env.local). Please check VITE_SISENSE_URL and VITE_SISENSE_TOKEN.");
  root.render(
    <div style={{ color: 'red', backgroundColor: '#131F29', padding: '50px', margin: '20px', borderRadius: '8px', textAlign: 'center', fontSize: '18px', fontFamily: "'Poppins', sans-serif", border: '1px solid #F05959' }}>
      <h1>Application Configuration Error!</h1>
      <p>The Sisense URL or API Token is not defined in your <code>.env.local</code> file.</p>
      <p>Please ensure the file exists in the project root and contains valid entries for:</p>
      <p><code>VITE_SISENSE_URL=your_sisense_instance_url</code></p>
      <p><code>VITE_SISENSE_TOKEN=your_api_token</code></p>
      <p>After creating or updating the file, you <strong>must restart your development server</strong>.</p>
    </div>
  );
} else {
  root.render(
    <React.StrictMode>
      <SisenseContextProvider
        url={sisenseUrlFromEnv} 
        token={sisenseTokenFromEnv} 
      >
        <App />
      </SisenseContextProvider>
    </React.StrictMode>
  );
}
