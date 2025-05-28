import { useState, useMemo, useEffect, useCallback } from 'react';
import './App.css'; // Ensure this is imported
import AccountTable from './components/AccountTable';
import WidgetLibrary from './components/WidgetLibrary';
import DashboardItem from './components/DashboardItem';
import Modal from './components/Modal';
import NotepadWidget from './components/NotepadWidget';
import ContextMenu from './components/ContextMenu';

import { useExecuteQueryByWidgetId } from '@sisense/sdk-ui';

import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export type AccountRow = {
  id: string;
  account: string; industry: string; description: string; website: string;
  revScore: number | null; employees: number | null; annualRevenue: number | null;
  lastActivityDate: string | null;
  isLoading: boolean;
};

interface SisenseCell { data: string | number | boolean | null; }
interface SisenseColumn { id: string; name: string; type: string; }

export interface WidgetConfig {
  id: string;
  title: string;
  type: string;
}

export interface WidgetComponentProps {
  isLayoutEditable: boolean;
}

const ACTIVE_WIDGETS_CONFIG_STORAGE_KEY = 'patrickDashboardActiveWidgetsConfig_rgl_final_v1';
const LAYOUT_STORAGE_KEY = 'patrickDashboardLayout_rgl_final_v1';

const RGL_COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
const RGL_ROW_HEIGHT = 50;
const RGL_DEFAULT_WIDGET_W = 4;
const RGL_DEFAULT_WIDGET_H = 8;
const RGL_ACCOUNT_TABLE_DEFAULT_H = 8;
const RGL_NOTEPAD_DEFAULT_H = 7;

// Props for ContextMenu
interface ContextMenuPropsState {
  x: number;
  y: number;
  widgetId: string;
}

function App() {
  const baseWidgetId = '68248ac4f8d1a53383881a9a';
  const dashboardId = '6824898af8d1a53383881a96';

  const { data: sisenseData, isLoading, isError, error } = useExecuteQueryByWidgetId({
    widgetOid: baseWidgetId,
    dashboardOid: dashboardId,
  });

  const columnNameMapping: { [sisenseName: string]: keyof AccountRow } = {
    'Account Name': 'account', 'Industry': 'industry', 'Description': 'description',
    'Website': 'website', 'Rev Score': 'revScore', 'Zoominfo Employees': 'employees',
    'Annual Revenue': 'annualRevenue', 'Last Activity Date': 'lastActivityDate'
  };

  const flatData = useMemo<AccountRow[]>(() => {
    if (!sisenseData || !sisenseData.rows || sisenseData.rows.length === 0) return [];
    const columns: SisenseColumn[] = sisenseData.columns as SisenseColumn[];
    return sisenseData.rows.map((rowCells: SisenseCell[], rowIndex: number) => {
      const accountRow: Partial<AccountRow> = { id: `row-${rowIndex}-${Date.now()}` };
      columns.forEach((column: SisenseColumn, colIndex: number) => {
        const sisenseColumnName = column.name;
        const targetKey = columnNameMapping[sisenseColumnName];
        if (targetKey) {
          let cellValue = rowCells[colIndex]?.data;
          if (targetKey === 'revScore' || targetKey === 'employees' || targetKey === 'annualRevenue') {
            const num = parseFloat(String(cellValue));
            cellValue = !isNaN(num) ? num : null;
          } else if (targetKey === 'lastActivityDate') {
            cellValue = cellValue ? String(cellValue) : null;
          } else {
            cellValue = cellValue !== undefined && cellValue !== null ? String(cellValue) : '';
          }
          accountRow[targetKey] = cellValue as any;
        }
      });
      Object.values(columnNameMapping).forEach(k => {
        if (!(k in accountRow)) {
          if (k === 'revScore' || k === 'employees' || k === 'annualRevenue' || k === 'lastActivityDate') {
            accountRow[k] = null;
          } else if (k === 'isLoading') {
            accountRow[k] = false;
          } else if (k !== 'id') {
             accountRow[k] = '';
          }
        }
      });
      return accountRow as AccountRow;
    });
  }, [sisenseData, columnNameMapping]);

  const [isWidgetModalOpen, setIsWidgetModalOpen] = useState(false);
  const [isLayoutEditable, setIsLayoutEditable] = useState(false);
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuProps, setContextMenuProps] = useState<ContextMenuPropsState | null>(null);

  const initialAccountTableWidgetConfig: WidgetConfig = {
    id: 'account-table',
    title: "Patrick's Named Accounts",
    type: 'account-table',
  };

  const [widgetsConfig, setWidgetsConfig] = useState<WidgetConfig[]>(() => {
    const saved = localStorage.getItem(ACTIVE_WIDGETS_CONFIG_STORAGE_KEY);
    if (saved) {
      try {
        const parsedConfigs = JSON.parse(saved) as WidgetConfig[];
        if (!parsedConfigs.find(w => w.id === initialAccountTableWidgetConfig.id)) {
          return [initialAccountTableWidgetConfig, ...parsedConfigs];
        }
        return parsedConfigs;
      } catch (e) { console.error("Failed to parse widget configs from localStorage", e); }
    }
    return [initialAccountTableWidgetConfig];
  });

  const [layouts, setLayouts] = useState<Layouts>(() => {
    const savedLayouts = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (savedLayouts) {
      try {
        return JSON.parse(savedLayouts);
      } catch (e) { console.error("Failed to parse layouts from localStorage", e); }
    }
    const initialLayout: Layout[] = widgetsConfig.map((widget, index) => {
        let h = RGL_DEFAULT_WIDGET_H;
        let w = RGL_DEFAULT_WIDGET_W;
        if (widget.id === initialAccountTableWidgetConfig.id) {
            h = RGL_ACCOUNT_TABLE_DEFAULT_H;
            w = RGL_COLS.lg;
        } else if (widget.type === 'NOTEPAD_WIDGET') {
            h = RGL_NOTEPAD_DEFAULT_H;
        }
        return { i: widget.id, x: (index * w) % RGL_COLS.lg, y: Infinity, w: w, h: h };
    });
    return { lg: initialLayout };
  });

  useEffect(() => {
    localStorage.setItem(ACTIVE_WIDGETS_CONFIG_STORAGE_KEY, JSON.stringify(widgetsConfig));
  }, [widgetsConfig]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts));
  }, [layouts]);

  const onLayoutChange = useCallback((_newLayout: Layout[], allLayouts: Layouts) => {
    if (allLayouts.lg) {
        setLayouts(prevLayouts => ({ ...prevLayouts, lg: allLayouts.lg }));
    } else if (_newLayout && _newLayout.length > 0 && _newLayout[0]?.i) {
        const currentBreakpoint = Object.keys(RGL_COLS).find(bpKey => allLayouts[bpKey as keyof typeof RGL_COLS] === _newLayout) || 'lg';
        setLayouts(prevLayouts => ({ ...prevLayouts, [currentBreakpoint]: _newLayout}));
    }
  }, []);

  const handleAddWidget = useCallback((type: string, title: string) => {
    const newWidgetId = `widget-${Date.now()}`;
    const newWidgetConfig: WidgetConfig = { id: newWidgetId, type, title };
    setWidgetsConfig(prev => [...prev, newWidgetConfig]);
    setLayouts(prevLayouts => {
      const currentLgLayout = prevLayouts.lg || [];
      let h = RGL_DEFAULT_WIDGET_H;
      let w = RGL_DEFAULT_WIDGET_W;
      if (type === 'NOTEPAD_WIDGET') h = RGL_NOTEPAD_DEFAULT_H;
      const newLayoutItem: Layout = { i: newWidgetId, x: (currentLgLayout.length * w) % RGL_COLS.lg, y: Infinity, w: w, h: h };
      return { ...prevLayouts, lg: [...currentLgLayout, newLayoutItem] };
    });
    setIsWidgetModalOpen(false);
  }, []);

  const handleRemoveWidget = useCallback((idToRemove: string) => {
    if (idToRemove === initialAccountTableWidgetConfig.id) {
      console.warn("[App] The 'Account Table' widget cannot be removed.");
      return;
    }
    setWidgetsConfig(prev => prev.filter(widget => widget.id !== idToRemove));
    setLayouts(prevLayouts => {
      const newLayoutsLg = (prevLayouts.lg || []).filter(item => item.i !== idToRemove);
      const updatedLayouts: Layouts = { ...prevLayouts, lg: newLayoutsLg };
      Object.keys(prevLayouts).forEach(bpKey => {
        if (bpKey !== 'lg' && Array.isArray(prevLayouts[bpKey as keyof Layouts])) {
            updatedLayouts[bpKey as keyof Layouts] = (prevLayouts[bpKey as keyof Layouts] as Layout[]).filter(item => item.i !== idToRemove);
        }
      });
      return updatedLayouts;
    });
    setIsContextMenuOpen(false); // Close context menu after action
  }, [initialAccountTableWidgetConfig.id]);

  const toggleLayoutEditMode = () => setIsLayoutEditable(prev => !prev);
  const openWidgetModal = () => setIsWidgetModalOpen(true);
  const closeWidgetModal = () => setIsWidgetModalOpen(false);

  const handleWidgetContextMenu = (event: React.MouseEvent, widgetId: string) => {
    event.preventDefault();
    if (isLayoutEditable && widgetId !== initialAccountTableWidgetConfig.id) {
      setContextMenuProps({ x: event.clientX, y: event.clientY, widgetId });
      setIsContextMenuOpen(true);
    }
  };

  const closeContextMenu = () => {
    setIsContextMenuOpen(false);
    setContextMenuProps(null);
  };

  const getWidgetComponent = useCallback((widgetConfig: WidgetConfig) => {
      const componentProps: WidgetComponentProps = {
          isLayoutEditable,
      };

      switch (widgetConfig.type) {
          case 'account-table':
              return ( <AccountTable {...componentProps} tableData={flatData} isLoading={isLoading} isError={isError} error={error} storageScopeKey="mainAccountTable_sfdc_final_v1" /> );
          case 'NOTEPAD_WIDGET':
              return ( <NotepadWidget {...componentProps} id={widgetConfig.id} /> );
          default:
              return ( <DashboardItem {...componentProps} title={widgetConfig.title} type={widgetConfig.type} allData={flatData} isLoading={isLoading} /> );
      }
  }, [flatData, isLoading, isError, error, isLayoutEditable]);

  const widgetElements = useMemo(() => {
    return (layouts.lg || []).map(layoutItem => {
      const widgetConfig = widgetsConfig.find(w => w.id === layoutItem.i);
      if (!widgetConfig) return null;
      return (
        <div
          key={layoutItem.i}
          className={`grid-item-widget ${isLayoutEditable ? 'edit-mode' : ''}`}
          onContextMenu={(e) => handleWidgetContextMenu(e, layoutItem.i)} // Added onContextMenu
        >
          <div className="widget-header">
            <span className="widget-title">{widgetConfig.title}</span>
            {isLayoutEditable && widgetConfig.id !== initialAccountTableWidgetConfig.id && (
              <button
                className="remove-widget-button-rgl"
                onClick={(e) => { e.stopPropagation(); handleRemoveWidget(layoutItem.i); }}
                title="Remove widget"
              >
                &times;
              </button>
            )}
          </div>
          <div className="widget-content-rgl">{getWidgetComponent(widgetConfig)}</div>
        </div>
      );
    }).filter(Boolean);
  }, [layouts.lg, widgetsConfig, isLayoutEditable, handleRemoveWidget, getWidgetComponent, handleWidgetContextMenu]); // Added handleWidgetContextMenu to dependencies

  return (
    <div className="App">
      <div className="app-header">
        <h1>Patrick's Dashboard</h1>
        <div className="header-actions">
          <button onClick={toggleLayoutEditMode} className={`edit-layout-toggle-button ${isLayoutEditable ? 'editing' : ''}`}>
            {isLayoutEditable ? 'Lock Layout' : 'Edit Layout'}
          </button>
          <button onClick={openWidgetModal} className="add-widget-main-button">
            Add Widget
          </button>
        </div>
      </div>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={RGL_COLS}
        cols={RGL_COLS}
        rowHeight={RGL_ROW_HEIGHT}
        isDraggable={isLayoutEditable}
        isResizable={isLayoutEditable}
        onLayoutChange={onLayoutChange}
        draggableHandle=".widget-header"
        compactType="vertical"
        useCSSTransforms={true}
      >
        {widgetElements}
      </ResponsiveGridLayout>
      {isWidgetModalOpen && <Modal onClose={closeWidgetModal} title="Select a Widget to Add"><WidgetLibrary onAddWidget={handleAddWidget} /></Modal>}
      {isContextMenuOpen && contextMenuProps && (
        <ContextMenu
          x={contextMenuProps.x}
          y={contextMenuProps.y}
          widgetId={contextMenuProps.widgetId}
          onRemoveWidget={handleRemoveWidget}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}

export default App;