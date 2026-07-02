'use client';

import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelUploaderProps {
  roomId: string;
  onUploadSuccess: (roomId: string, data: any[]) => Promise<void>;
}

export function ExcelUploader({ roomId, onUploadSuccess }: ExcelUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // 1. Convert rows to JSON objects
        const rawData = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          window.alert("The uploaded spreadsheet appears to be empty.");
          return;
        }

        // 2. FORCE SERIALIZATION SANITIZATION (The Fix)
        // This turns anything complex into purely raw data strings and numbers, 
        // instantly dropping any hidden non-serializable Excel object methods.
        const cleanPlainObjects = JSON.parse(JSON.stringify(rawData));

        // 3. Send the guaranteed clean array up to our Server Action
        await onUploadSuccess(roomId, cleanPlainObjects);
        window.alert(`🎉 Successfully processed bulk asset upload sequence!`);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        console.error(err);
        window.alert("An error occurred while reading the Excel configuration format.");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="mt-4 p-4 border border-dashed border-slate-200 bg-slate-50/50 rounded-xl text-center">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
        Bulk Upload Layout
      </label>
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        disabled={isProcessing}
        className="hidden"
        id="excel-file-upload-input"
      />
      <label
        htmlFor="excel-file-upload-input"
        className={`inline-block bg-white border shadow-sm text-slate-700 font-medium text-xs py-2 px-4 rounded-lg cursor-pointer hover:bg-slate-50 select-none transition-all ${
          isProcessing ? 'opacity-50 pointer-events-none' : ''
        }`}
      >
        {isProcessing ? 'Processing Inventory Rows...' : '📂 Choose Excel Sheet (.xlsx)'}
      </label>
      <p className="text-[10px] text-slate-400 mt-2 font-mono">
        Expected Headers: Brand | Model | Condition | Serial | CPU
      </p>
    </div>
  );
}