import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import type { SortingState, ColumnFiltersState, ColumnSizingState, ColumnDef, Cell } from '@tanstack/react-table';
import ContextMenu from './ContextMenu';
import type { AccountRow, WidgetComponentProps } from '../App';
// import '../App.css'; // CSS handled globally

// --- Define props ---
interface AccountTableProps extends WidgetComponentProps {
  tableData: AccountRow[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined | null;
  storageScopeKey: string;
}

// --- NEW: Updated Font Options based on Sisense Guidelines ---
const POPPINS_FONT_STACK = "'Poppins', sans-serif";
const DM_SANS_FONT_STACK = "'DM Sans', sans-serif";
const MONO_FONT_STACK = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace";

const fontOptions = [
  { label: 'Default (DM Sans)', value: DM_SANS_FONT_STACK },
  { label: 'Headline (Poppins)', value: POPPINS_FONT_STACK },
  { label: 'Code (Mono)', value: MONO_FONT_STACK },
  // Optional: Add back others if truly needed, but sticking to brand is best
  // { label: 'Sans Serif (System)', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif" },
  // { label: 'Serif (System)', value: "Georgia, 'Times New Roman', Times, serif" },
];

// --- Helper Functions (Keep as they are) ---
const getEmployeeSegmentColor = (employees: number | null): string => { if (employees === null) return '#555'; if (employees <= 200) return '#94F5F0'; if (employees <= 999) return '#1DE4EB'; return '#D7F77D'; }; // Use Sisense accents
const getBarWidth = (employees: number | null): string => { if (employees === null || employees <= 0) return '0%'; const maxEmployeesLog = Math.log10(50000); const currentLog = Math.log10(employees); const widthPercentage = Math.min(100, (currentLog / maxEmployeesLog) * 100); return `${widthPercentage}%`; };
const formatDate = (dateString: string | null): string => { if (!dateString || dateString.toLowerCase() === 'n\\a' || dateString.toLowerCase() === 'n/a') return 'N/A'; try { return new Date(dateString).toLocaleDateString(); } catch { return dateString; } };
const formatNumber = (num: number | null): string => { return num !== null ? num.toLocaleString() : 'N/A'; };
const getIndustryColor = (industryName: string): string => { const sisenseAccents = ['#1DE4EB', '#D7F77D', '#F05959', '#94F5F0', '#A7F3D0', '#BFDBFE', '#FDE68A', '#FBCFE8', '#C7D2FE', '#FDBA74']; let hash = 0; if (industryName) { for (let i = 0; i < industryName.length; i++) { hash = industryName.charCodeAt(i) + ((hash << 5) - hash); hash |= 0; } } return sisenseAccents[Math.abs(hash) % sisenseAccents.length]; }; // Use Sisense + others
const getLastActivityColor = (dateString: string | null): string => { const greyColor = '#A0B0C0'; if (!dateString || dateString.toLowerCase() === 'n\\a' || dateString.toLowerCase() === 'n/a') return greyColor; const activityDate = new Date(dateString); const today = new Date(); if (isNaN(activityDate.getTime())) return greyColor; const diffTime = today.getTime() - activityDate.getTime(); if (diffTime < 0) return greyColor; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays <= 30) return '#F05959'; if (diffDays <= 90) return '#D7F77D'; if (diffDays <= 180) return '#1DE4EB'; return greyColor; }; // Use Sisense accents

// --- TypeScript Augmentation & Cell Style Interface ---
declare module '@tanstack/react-table' { interface ColumnMeta<TData extends unknown, TValue> { isNumeric?: boolean; textAlign?: 'left' | 'center' | 'right'; fontWeight?: 'normal' | 'bold' | string; fontStyle?: 'normal' | 'italic'; fontFamily?: string; fontSize?: string; } }
interface CellSpecificStyle { fontFamily?: string; textAlign?: 'left' | 'center' | 'right'; }

// --- Column Definitions (Updated Account Name Style) ---
const columnHelper = createColumnHelper<AccountRow>();
const columns: ColumnDef<AccountRow, any>[] = [
  columnHelper.accessor('account', {
      header: 'Account Name',
      cell: info => {
          const accountName = info.getValue();
          const website = info.row.original.website;
          // Apply .account-name-code-style (now uses Poppins)
          const content = <span className="account-name-code-style">{accountName}</span>;
          if (website && typeof website === 'string' && website.trim() !== '' && website !== 'N/A') {
              const href = website.startsWith('http') ? website : `https://${website}`;
              return <a href={href} target="_blank" rel="noopener noreferrer" title={`Visit ${website}`}>{content}</a>;
          }
          return content;
      },
      size: 250,
      meta: {
          fontWeight: '600', // Poppins often looks good slightly bolder
          fontSize: '0.9rem', // Adjust as needed
          textAlign: 'left',
          fontFamily: POPPINS_FONT_STACK, // Default to Poppins for this column
      },
  }),
  columnHelper.accessor('description', { header: 'Description', cell: info => <div className="description-cell-single-line" title={info.getValue()}>{info.getValue()}</div>, size: 450, meta: { fontFamily: DM_SANS_FONT_STACK } }),
  columnHelper.accessor('industry', { header: 'Industry', cell: info => { const industry = info.getValue(); const color = getIndustryColor(industry); return ( <span style={{ color: color, fontWeight: '500' }}> {industry} </span> ); }, size: 180, meta: { fontStyle: 'normal', fontWeight: '500', textAlign: 'center', fontFamily: DM_SANS_FONT_STACK } }),
  columnHelper.accessor('employees', { header: 'ZoomInfo Employees', cell: info => { const employees = info.getValue() as number | null; const color = getEmployeeSegmentColor(employees); const width = getBarWidth(employees); return (<div className="employee-cell"><span className="employee-number">{formatNumber(employees)}</span><div className="employee-bar-container"><div className="employee-bar" style={{ width: width, backgroundColor: color }}/></div></div>); }, size: 280, meta: { textAlign: 'center', fontFamily: DM_SANS_FONT_STACK } }),
  columnHelper.accessor('website', { header: 'Website', cell: info => { const originalUrl = info.getValue(); if (typeof originalUrl === 'string' && originalUrl.trim() !== '' && originalUrl !== 'N/A') { const displayUrl = originalUrl.replace(/^(?:https?:\/\/)?(?:www\.)?/i, ''); const href = originalUrl.startsWith('http') ? originalUrl : `https://${originalUrl}`; return <a href={href} target="_blank" rel="noopener noreferrer" title={originalUrl}>{displayUrl}</a>; } return originalUrl; }, size: 160, meta: { fontFamily: DM_SANS_FONT_STACK } }),
  columnHelper.accessor('annualRevenue', { header: 'Annual Revenue', cell: info => `$${formatNumber(info.getValue())}`, size: 120, meta: { isNumeric: true, textAlign: 'center', fontFamily: DM_SANS_FONT_STACK } }),
  columnHelper.accessor('revScore', { header: 'Rev Score', cell: info => info.getValue() ?? 'N/A', size: 80, meta: { isNumeric: true, textAlign: 'center', fontFamily: DM_SANS_FONT_STACK } }),
  columnHelper.accessor('lastActivityDate', { header: 'Last Activity', cell: info => { const dateValue = info.getValue(); const formattedDate = formatDate(dateValue); const color = getLastActivityColor(dateValue); return ( <span style={{ color: color, fontWeight: 'bold' }}> {formattedDate} </span> ); }, size: 100, meta: { textAlign: 'center', fontFamily: DM_SANS_FONT_STACK } }),
];

// --- Main Component (Updated Font Handling) ---
const AccountTable: React.FC<AccountTableProps> = ({ tableData, isLoading, isError, error, storageScopeKey }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const COLUMN_SIZING_STORAGE_KEY = `${storageScopeKey}_columnSizing_sisense`;
    const CELL_STYLES_STORAGE_KEY = `${storageScopeKey}_cellStyles_sisense`;
    const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => { const saved = localStorage.getItem(COLUMN_SIZING_STORAGE_KEY); try { return saved ? JSON.parse(saved) : {}; } catch (e) { return {}; } });
    const [cellStyleOverrides, setCellStyleOverrides] = useState<{ [cellId: string]: CellSpecificStyle }>(() => { const saved = localStorage.getItem(CELL_STYLES_STORAGE_KEY); try { return saved ? JSON.parse(saved) : {}; } catch (e) { return {}; } });
    useEffect(() => { localStorage.setItem(COLUMN_SIZING_STORAGE_KEY, JSON.stringify(columnSizing)); }, [columnSizing, COLUMN_SIZING_STORAGE_KEY]);
    useEffect(() => { localStorage.setItem(CELL_STYLES_STORAGE_KEY, JSON.stringify(cellStyleOverrides)); }, [cellStyleOverrides, CELL_STYLES_STORAGE_KEY]);
    const [selectedCellIds, setSelectedCellIds] = useState<Set<string>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartCell, setDragStartCell] = useState<{ rowIdx: number; colId: string } | null>(null);
    const isDraggingRef = React.useRef(isDragging);
    useEffect(() => { isDraggingRef.current = isDragging; }, [isDragging]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const scrollIntervalRef = useRef<number | null>(null);
    const [contextMenuData, setContextMenuData] = useState<{ x: number; y: number; columnId: string } | null>(null);
    const [isContextMenuVisible, setIsContextMenuVisible] = useState(false);

    const tableColumns = useMemo(() => columns, []);
    const uniqueIndustries = useMemo(() => { const industries = new Set(tableData.map(row => row.industry).filter(Boolean)); return ['All Industries', ...Array.from(industries).sort()]; }, [tableData]);

    const table = useReactTable({ data: tableData, columns: tableColumns, state: { sorting, columnFilters, columnSizing }, onSortingChange: setSorting, onColumnFiltersChange: setColumnFilters, onColumnSizingChange: setColumnSizing, columnResizeMode: 'onChange', enableColumnResizing: true, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize: 40 } }, meta: { fontFamily: DM_SANS_FONT_STACK } }); // Set DM Sans as table default

    const stopAutoScroll = useCallback(() => { if (scrollIntervalRef.current) { clearInterval(scrollIntervalRef.current); scrollIntervalRef.current = null; } }, []);
    const startAutoScroll = useCallback((direction: 'up' | 'down') => { stopAutoScroll(); const scrollAmount = direction === 'up' ? -20 : 20; scrollIntervalRef.current = window.setInterval(() => { if (scrollContainerRef.current) { scrollContainerRef.current.scrollTop += scrollAmount; } }, 50); }, [stopAutoScroll]);
    const handleMouseMoveOverTableArea = useCallback((event: React.MouseEvent<HTMLDivElement>) => { if (!isDraggingRef.current || !scrollContainerRef.current) { stopAutoScroll(); return; } const scrollNode = scrollContainerRef.current; const rect = scrollNode.getBoundingClientRect(); const mouseYInScroll = event.clientY - rect.top; const scrollThreshold = 50; if (mouseYInScroll < scrollThreshold && scrollNode.scrollTop > 0) { startAutoScroll('up'); } else if (mouseYInScroll > rect.height - scrollThreshold && scrollNode.scrollTop < scrollNode.scrollHeight - scrollNode.clientHeight) { startAutoScroll('down'); } else { stopAutoScroll(); } }, [startAutoScroll, stopAutoScroll]);
    const handleMouseDownOnCell = (cell: Cell<AccountRow, unknown>, event: React.MouseEvent) => { if (event.button === 2) return; setIsDragging(true); const startCellId = `${cell.row.id}-${cell.column.id}`; setDragStartCell({ rowIdx: cell.row.index, colId: cell.column.id }); if (event.metaKey || event.ctrlKey) { setSelectedCellIds(prevIds => { const newIds = new Set(prevIds); if (newIds.has(startCellId)) newIds.delete(startCellId); else newIds.add(startCellId); return newIds; }); } else { setSelectedCellIds(new Set([startCellId])); } };
    const handleMouseEnterCell = (cell: Cell<AccountRow, unknown>) => { if (!isDraggingRef.current || !dragStartCell) return; const newSelectedIds = new Set<string>(); const visibleRows = table.getRowModel().rows; const visibleColumns = table.getVisibleLeafColumns(); const startRowVisualIndex = dragStartCell.rowIdx; const startColVisualIndex = visibleColumns.findIndex(col => col.id === dragStartCell.colId); const currentRowVisualIndex = cell.row.index; const currentColVisualIndex = visibleColumns.findIndex(col => col.id === cell.column.id); if (startColVisualIndex === -1 || currentColVisualIndex === -1) return; const minRow = Math.min(startRowVisualIndex, currentRowVisualIndex); const maxRow = Math.max(startRowVisualIndex, currentRowVisualIndex); const minCol = Math.min(startColVisualIndex, currentColVisualIndex); const maxCol = Math.max(startColVisualIndex, currentColVisualIndex); for (let i = minRow; i <= maxRow; i++) { const row = visibleRows[i]; if (row) { for (let j = minCol; j <= maxCol; j++) { const col = visibleColumns[j]; if (col) { newSelectedIds.add(`${row.id}-${col.id}`); } } } } setSelectedCellIds(newSelectedIds); };
    const handleMouseUpGlobal = useCallback(() => { if (isDraggingRef.current) { setIsDragging(false); stopAutoScroll(); } }, [setIsDragging, stopAutoScroll]);
    useEffect(() => { if (isDragging) { document.body.classList.add('is-table-dragging'); document.addEventListener('mouseup', handleMouseUpGlobal); } else { document.body.classList.remove('is-table-dragging'); document.removeEventListener('mouseup', handleMouseUpGlobal); } return () => { document.body.classList.remove('is-table-dragging'); document.removeEventListener('mouseup', handleMouseUpGlobal); }; }, [isDragging, handleMouseUpGlobal]);
    useEffect(() => { return () => stopAutoScroll(); }, [stopAutoScroll]);
    const handleColumnSelect = useCallback((columnId: string) => { const newIds = new Set<string>(); table.getCoreRowModel().rows.forEach(row => { newIds.add(`${row.id}-${columnId}`); }); setSelectedCellIds(newIds); setContextMenuData(null); setIsContextMenuVisible(false); }, [table]);
    const handleHeaderContextMenu = (event: React.MouseEvent<HTMLTableHeaderCellElement>, columnId: string) => { event.preventDefault(); setContextMenuData({ x: event.clientX, y: event.clientY, columnId: columnId }); };
    const closeContextMenu = useCallback(() => { setContextMenuData(null); setIsContextMenuVisible(false); }, []);
    useEffect(() => { let frameId: number; if (contextMenuData) { frameId = requestAnimationFrame(() => { setIsContextMenuVisible(true); }); return () => cancelAnimationFrame(frameId); } else { setIsContextMenuVisible(false); } }, [contextMenuData]);
    const contextMenuItems = useMemo(() => { if (!contextMenuData) return []; return [{ label: 'Select Column', onClick: () => handleColumnSelect(contextMenuData.columnId) }]; }, [contextMenuData, handleColumnSelect]);
    const handleIndustryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => { const value = e.target.value; table.getColumn('industry')?.setFilterValue(value === 'All Industries' ? undefined : value); };
    const applyStyleToSelection = (style: Partial<CellSpecificStyle>) => { if (selectedCellIds.size > 0) { setCellStyleOverrides(prevStyles => { const newStyles = { ...prevStyles }; selectedCellIds.forEach(cellId => { newStyles[cellId] = { ...newStyles[cellId], ...style }; if (style.fontFamily === DM_SANS_FONT_STACK) delete newStyles[cellId].fontFamily; if (style.textAlign === undefined) delete newStyles[cellId].textAlign; }); return newStyles; }); } };
    const handleFontFamilyChangeForSelection = (fontFamily: string) => applyStyleToSelection({ fontFamily });
    const handleAlignmentChangeForSelection = (textAlign: 'left' | 'center' | 'right') => applyStyleToSelection({ textAlign });
    const [currentSelectionFont, setCurrentSelectionFont] = useState(DM_SANS_FONT_STACK); // Default to DM Sans
    const [currentSelectionAlign, setCurrentSelectionAlign] = useState<'left' | 'center' | 'right' | ''>('');

    useEffect(() => {
        const defaultFont = DM_SANS_FONT_STACK;
        if (selectedCellIds.size === 1) {
            const firstSelectedId = selectedCellIds.values().next().value;
            if (firstSelectedId) {
                setCurrentSelectionFont(cellStyleOverrides[firstSelectedId]?.fontFamily || defaultFont);
                setCurrentSelectionAlign(cellStyleOverrides[firstSelectedId]?.textAlign || '');
            } else {
                setCurrentSelectionFont(defaultFont);
                setCurrentSelectionAlign('');
            }
        } else if (selectedCellIds.size > 1) {
            let commonFont = defaultFont;
            let commonAlignAggregate: 'left' | 'center' | 'right' | '' | 'mixed' = '';
            let first = true;

            selectedCellIds.forEach(cellId => {
                const style = cellStyleOverrides[cellId];
                if (first) {
                    commonFont = style?.fontFamily || defaultFont;
                    commonAlignAggregate = style?.textAlign || '';
                    first = false;
                } else {
                    if (commonFont !== (style?.fontFamily || defaultFont)) commonFont = '';
                    if (commonAlignAggregate !== (style?.textAlign || '')) commonAlignAggregate = 'mixed';
                }
            });
            setCurrentSelectionFont(commonFont);
            const align = commonAlignAggregate as string;
            setCurrentSelectionAlign((align === 'left' || align === 'center' || align === 'right' || align === '') ? align : '');

        } else {
            setCurrentSelectionFont(defaultFont);
            setCurrentSelectionAlign('');
        }
    }, [selectedCellIds, cellStyleOverrides]);

    return (
        <div className="table-widget-container">
            <div className="table-controls">
                <select id="industryFilter" name="industryFilter" onChange={handleIndustryFilterChange} value={table.getColumn('industry')?.getFilterValue() as string ?? 'All Industries'} className="industry-filter-select">
                    {uniqueIndustries.map(industry => (<option key={industry} value={industry}>{industry}</option>))}
                </select>
                <div className="formatting-toolbar">
                    <label htmlFor="cellFontSelect">Font:</label>
                    <select id="cellFontSelect" value={currentSelectionFont} onChange={(e) => handleFontFamilyChangeForSelection(e.target.value)} disabled={selectedCellIds.size === 0} className="toolbar-select">
                        <option value="" disabled={currentSelectionFont !== '' && currentSelectionFont !== DM_SANS_FONT_STACK}>-- Font --</option>
                        {fontOptions.map(font => ( <option key={font.value} value={font.value}> {font.label} </option> ))}
                    </select>
                    <div className="alignment-buttons">
                        <span>Align:</span>
                        <button onClick={() => handleAlignmentChangeForSelection('left')} disabled={selectedCellIds.size === 0} title="Align Left" className={currentSelectionAlign === 'left' ? 'active' : ''}>L</button>
                        <button onClick={() => handleAlignmentChangeForSelection('center')} disabled={selectedCellIds.size === 0} title="Align Center" className={currentSelectionAlign === 'center' ? 'active' : ''}>C</button>
                        <button onClick={() => handleAlignmentChangeForSelection('right')} disabled={selectedCellIds.size === 0} title="Align Right" className={currentSelectionAlign === 'right' ? 'active' : ''}>R</button>
                    </div>
                </div>
            </div>
            {isLoading && <div className="table-message">Loading Table Data...</div>}
            {isError && <div className="table-message error">Error: {error instanceof Error ? (error.message || "Unknown error") : 'Unknown error'}</div>}
            {!isLoading && !isError && ( <>
              <div ref={scrollContainerRef} className="table-scroll-area" onMouseMove={handleMouseMoveOverTableArea} onMouseLeave={stopAutoScroll} >
                <table className="account-table">
                  <thead>{
                    table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>{
                        headerGroup.headers.map(header => (
                          <th key={header.id} style={{ width: header.getSize() }} colSpan={header.colSpan} className={`resizable-th context-menu-trigger`} onContextMenu={(e) => handleHeaderContextMenu(e, header.column.id)}>
                            {header.isPlaceholder ? null : ( <div {...{ className: header.column.getCanSort() ? 'th-content cursor-pointer select-none' : 'th-content', onClick: (e) => { e.stopPropagation(); header.column.getToggleSortingHandler()?.(e); } }} > {flexRender( header.column.columnDef.header, header.getContext() )} {{ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted() as string] ?? null} </div> )}
                            {header.column.getCanResize() && ( <div {...{ onMouseDown: (e) => { e.stopPropagation(); header.getResizeHandler()(e); }, onTouchStart: (e) => { e.stopPropagation(); header.getResizeHandler()(e); }, onClick: (e) => e.stopPropagation(), className: `resizer ${header.column.getIsResizing() ? 'isResizing' : ''}`, }} /> )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>{
                    table.getRowModel().rows.map(row => (
                      <tr key={row.id}>{
                        row.getVisibleCells().map(cell => {
                          const cellId = `${row.id}-${cell.column.id}`; const cellSpecificStyle = cellStyleOverrides[cellId];
                          const defaultFontFamily = cell.column.columnDef.meta?.fontFamily || DM_SANS_FONT_STACK;
                          const finalCellStyle: React.CSSProperties = {
                              textAlign: cellSpecificStyle?.textAlign || cell.column.columnDef.meta?.textAlign || (cell.column.columnDef.meta?.isNumeric ? 'right' : 'left'),
                              fontWeight: cell.column.columnDef.meta?.fontWeight || 'normal', fontStyle: cell.column.columnDef.meta?.fontStyle || 'normal',
                              fontSize: cell.column.columnDef.meta?.fontSize || 'inherit',
                              fontFamily: cellSpecificStyle?.fontFamily || defaultFontFamily, // Use specific, then meta, then default
                          };
                          return ( <td key={cell.id} style={finalCellStyle} onMouseDown={(e) => handleMouseDownOnCell(cell, e)} onMouseEnter={() => handleMouseEnterCell(cell)} className={selectedCellIds.has(cellId) ? 'selected-cell' : ''} > {flexRender(cell.column.columnDef.cell, cell.getContext())} </td> );
                        }) }
                      </tr>
                    ))}
                  </tbody>
                </table>
                {table.getRowModel().rows.length === 0 && ( <div className="table-message">No results found.</div> )}
              </div>
              <div className="pagination-controls">
                <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>{'<<'}</button>
                <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>{'<'}</button>
                <span> Page{' '} <strong>{table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</strong> </span>
                <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>{ '>'}</button>
                <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>{'>>'}</button>
              </div>
            </> )}
            {/* ContextMenu rendering causing error removed for now */}
        </div>
    );
};

export default AccountTable;