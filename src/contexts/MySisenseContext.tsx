// src/contexts/MySisenseContext.tsx
import React, { createContext, useContext, type ReactNode } from 'react';

interface MySisenseContextType {
  baseUrl?: string;
  token?: string;
}

const MySisenseContext = createContext<MySisenseContextType | undefined>(undefined);

interface MyCustomSisenseContextProviderProps {
  children: ReactNode;
}

export const MyCustomSisenseContextProvider: React.FC<MyCustomSisenseContextProviderProps> = ({ children }) => {
  // Hardcoded values for demonstration.
  const baseUrl = "https://rollandsandbox.sisensepoc.com";
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiNjdmODJlODNjMGFkOTMwMDJlMGRkMmViIiwiYXBpU2VjcmV0IjoiMmViMzZjM2UtY2YwZS05ZDk5LTU1MTYtYmM5MjI0Y2E5Nzc4IiwiYWxsb3dlZFRlbmFudHMiOlsiNjcyZGVjMDI2MmRlM2IwMDFjNGVjMjYyIl0sInRlbmFudElkIjoiNjcyZGVjMDI2MmRlM2IwMDFjNGVjMjYyIiwiZXhwIjoxNzQ4NzkyNjM1fQ.2dzTXyyTl04eZiOpSeqxqaEPTQX62ABmWZw82eRkwjM";

  if (!baseUrl || !token) {
    console.error('BaseURL or Token is not set in MyCustomSisenseContextProvider.');
  }
  
  return (
    <MySisenseContext.Provider value={{ baseUrl, token }}>
      {children}
    </MySisenseContext.Provider>
  );
};

export const useMyCustomSisenseContext = (): MySisenseContextType => {
  const context = useContext(MySisenseContext);
  if (context === undefined) {
    console.error('useMyCustomSisenseContext must be used within a MyCustomSisenseContextProvider.');
    return { baseUrl: undefined, token: undefined };
  }
  return context;
};