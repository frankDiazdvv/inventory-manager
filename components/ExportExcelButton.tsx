'use client';

import React from 'react';
import * as XLSX from 'xlsx';

interface ExportExcelButtonProps {
  roomName: string;
  stockedItems: any[];
  floorItems: any[];
  recycleItems: any[];
}

export function ExportExcelButton({
  roomName,
  stockedItems,
  floorItems,
  recycleItems,
}: ExportExcelButtonProps) {
  
  const handleExport = () => {
    // 1. Initialize a completely blank workbook container
    const workbook = XLSX.utils.book_new();

    // 2. Data mapper helper to cleanly flatten objects into readable spreadsheet rows
    const mapItemsToRows = (itemsArray: any[], includeAssignee = false) => {
      return itemsArray.map((item) => {
        const row: any = {
          'Brand': item.brand,
          'Model': item.model,
          'Condition': item.condition,
          'Serial (Last 5)': item.serialLast5,
          'Specs Data': typeof item.specs === 'object' ? JSON.stringify(item.specs) : item.specs,
        };
        
        if (includeAssignee) {
          row['Assigned To'] = item.assignedTo || 'Unassigned';
        }
        
        return row;
      });
    };

    // 3. Convert mapped data arrays into separate Excel Worksheets
    const stockedWS = XLSX.utils.json_to_sheet(mapItemsToRows(stockedItems));
    const floorWS = XLSX.utils.json_to_sheet(mapItemsToRows(floorItems, true));
    const recycleWS = XLSX.utils.json_to_sheet(mapItemsToRows(recycleItems));

    // 4. Set auto-fit or specific layout column width spacing overrides for readability
    const defaultWidths = [{ wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 20 }];
    stockedWS['!cols'] = defaultWidths;
    floorWS['!cols'] = defaultWidths;
    recycleWS['!cols'] = defaultWidths;

    // 5. Append each sheet to the master workbook container as structural tabs
    XLSX.utils.book_append_sheet(workbook, stockedWS, 'Stocked Items');
    XLSX.utils.book_append_sheet(workbook, floorWS, 'Items on Floor');
    XLSX.utils.book_append_sheet(workbook, recycleWS, 'Items to Recycle');

    // 6. Generate filename string and trigger instant browser-level asset download
    const cleanRoomName = roomName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const filename = `${cleanRoomName}_inventory_export.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg shadow-sm border border-emerald-500 cursor-pointer select-none transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
      title="Download complete room inventory logs as a structured Excel Workbook"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="14" 
        height="14" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="lucide lucide-download"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" x2="12" y1="15" y2="3"/>
      </svg>
      Export Excel
    </button>
  );
}