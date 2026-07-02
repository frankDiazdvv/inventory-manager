'use client';

import { useState } from 'react';
import { RemoveItemButton } from './RemoveItemButton';

interface CollapsibleTableProps {
  title: string;
  items: any[];
  statusContext: 'STOCKED' | 'FLOOR' | 'RECYCLE';
  currentRoomId: string;
  searchQuery: string;
  sortBy: string;
  order: string;
  updateItemStatus: (itemId: string, newStatus: string, assignedTo?: string) => Promise<void>;
  updateItemCondition: (itemId: string, newCondition: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
}

export function CollapsibleTable({
  title,
  items,
  statusContext,
  currentRoomId,
  searchQuery,
  sortBy,
  order,
  updateItemStatus,
  updateItemCondition,
  deleteItem,
}: CollapsibleTableProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Helper function to handle status updates with strict verification prompts
  const handleStatusTransition = async (item: any, targetStatus: 'STOCKED' | 'FLOOR' | 'RECYCLE') => {
    let employeeName = '';

    // Guardrail rule #1: Moving an asset onto the Floor
    if (targetStatus === 'FLOOR') {
      const nameInput = window.prompt(`Who is this ${item.brand} ${item.model} being assigned to?`);
      if (!nameInput || nameInput.trim() === '') {
        window.alert("❌ An employee assignment name is required to move items to the floor.");
        return;
      }
      employeeName = nameInput.trim();

      const serialInput = window.prompt(`Confirm assignment by entering the last 5 characters of the serial: "${item.serialLast5}"`);
      if (serialInput?.trim().toUpperCase() !== item.serialLast5.toUpperCase()) {
        window.alert("❌ Serial mismatch. Asset operation cancelled.");
        return;
      }
    }

    // Guardrail rule #2: Moving an asset to Recycle log status
    if (targetStatus === 'RECYCLE') {
      const serialInput = window.prompt(`Confirm recycling pipeline move by entering the last 5 characters of the serial: "${item.serialLast5}"`);
      if (serialInput?.trim().toUpperCase() !== item.serialLast5.toUpperCase()) {
        window.alert("❌ Serial mismatch. Asset operation cancelled.");
        return;
      }
    }

    // Trigger Server Action if all checkpoints pass cleanly
    await updateItemStatus(item.id, targetStatus, employeeName);
  };

  const getSortLink = (columnField: string) => {
    const isCurrentField = sortBy === columnField;
    const nextOrder = isCurrentField && order === 'asc' ? 'desc' : 'asc';
    const params = new URLSearchParams();
    if (currentRoomId) params.set('room', currentRoomId);
    if (searchQuery) params.set('search', searchQuery);
    params.set('sortBy', columnField);
    params.set('order', nextOrder);
    return `/?${params.toString()}`;
  };

  const renderSortArrow = (columnField: string) => {
    if (sortBy !== columnField) return ' ↕';
    return order === 'asc' ? ' ▲' : ' ▼';
  };

  return (
    <div className="col-span-2 bg-white rounded-xl shadow-sm border overflow-hidden">
      <div 
        className="flex justify-between items-center p-4 bg-slate-50 border-b cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="font-semibold text-slate-800">
          {title} ({items.length})
        </h3>
        <button className="text-slate-500 font-medium text-sm px-2 py-1 rounded hover:bg-slate-200">
          {isOpen ? 'Collapse ▽' : 'Expand ▷'}
        </button>
      </div>

      {isOpen && (
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-3 px-2">
                  <a href={getSortLink('model')} className="hover:text-slate-900 inline-flex items-center gap-1">
                    Brand/Model {renderSortArrow('model')}
                  </a>
                </th>
                <th className="py-3 px-2">
                  <a href={getSortLink('serialLast5')} className="hover:text-slate-900 inline-flex items-center gap-1">
                    Serial {renderSortArrow('serialLast5')}
                  </a>
                </th>
                <th className="py-3 px-2">
                  <a href={getSortLink('condition')} className="hover:text-slate-900 inline-flex items-center gap-1">
                    Condition {renderSortArrow('condition')}
                  </a>
                </th>
                <th className="py-3 px-2 text-slate-400 font-medium">Specs / Assignment</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  {/* ITEM BRAND+MODEL FIELD */}
                  <td className="py-3 px-2 font-medium">
                    {item.brand} <span className="text-slate-500 font-normal">{item.model}</span>
                  </td>

                  {/* ITEM SERIAL NUMBER FIELD */}
                  <td className="py-3 px-2 font-mono text-xs bg-slate-100 rounded">{item.serialLast5}</td>
                  {/* ITEM CONDITION FIELD */}
                  <td className="py-3 px-2">
                    <select
                      value={item.condition}
                      onChange={async (e) => {
                        const nextCondition = e.target.value;
                        try {
                          await updateItemCondition(item.id, nextCondition);
                        } catch (err) {
                          window.alert("Failed to modify asset condition settings.");
                        }
                      }}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border-none bg-opacity-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        item.condition === 'Excellent' ? 'bg-blue-100 text-blue-700' :
                        item.condition === 'Good' ? 'bg-green-100 text-green-700' :
                        item.condition === 'Fair' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <option value="Excellent" className="bg-white text-slate-900 font-normal">Excellent</option>
                      <option value="Good" className="bg-white text-slate-900 font-normal">Good</option>
                      <option value="Fair" className="bg-white text-slate-900 font-normal">Fair</option>
                      <option value="Bad" className="bg-white text-slate-900 font-normal">Bad</option>
                    </select>
                  </td>
                  
                  {/* Updated Specs column to dynamically show the employee tracking data */}
                  <td className="py-3 px-2 text-xs text-slate-500 font-mono">
                    {item.status === 'FLOOR' && item.assignedTo ? (
                      <span className="bg-blue-50 text-blue-700 font-sans font-medium px-2 py-1 rounded border border-blue-100">
                        👤 User: {item.assignedTo}
                      </span>
                    ) : (
                      JSON.stringify(item.specs)
                    )}
                  </td>
                  
                  <td className="py-2 px-2 text-right space-x-2 whitespace-nowrap">
                    {statusContext !== 'STOCKED' && (
                      <button 
                        onClick={() => handleStatusTransition(item, 'STOCKED')}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded font-medium cursor-pointer transition-colors"
                      >
                        📦 Stock
                      </button>
                    )}
                    {statusContext !== 'FLOOR' && (
                      <button 
                        onClick={() => handleStatusTransition(item, 'FLOOR')}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium cursor-pointer transition-colors"
                      >
                        🏢 Floor
                      </button>
                    )}
                    {statusContext !== 'RECYCLE' && (
                      <button 
                        onClick={() => handleStatusTransition(item, 'RECYCLE')}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs px-2 py-1 rounded font-medium cursor-pointer transition-colors"
                      >
                        ♻️ Recycle
                      </button>
                    )}
                    {statusContext === 'RECYCLE' && (
                      <div className="inline-block align-middle ml-2">
                        <RemoveItemButton 
                          itemId={item.id} 
                          serialLast5={item.serialLast5} 
                          onConfirmDelete={deleteItem} 
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 italic">No assets inside this log status.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}