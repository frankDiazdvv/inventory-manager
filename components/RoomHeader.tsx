'use client';

import { useState } from 'react';
import { DeleteRoomButton } from './DeleteRoom';
import { ExportExcelButton } from './ExportExcelButton'; // Import here

interface RoomHeaderProps {
  roomName: string;
  currentRoomId: string;
  deleteRoomAction: (id: string) => Promise<void>;
  stockedItems: any[];
  floorItems: any[];
  recycleItems: any[];
}

export function RoomHeader({ 
  roomName, 
  currentRoomId, 
  deleteRoomAction,
  stockedItems,
  floorItems,
  recycleItems
}: RoomHeaderProps) {
  const [toggleMenu, setToggleMenu] = useState(false);

  return (
    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl border shadow-sm">
      <div>
        <div className="flex items-center gap-3 relative">
          <h2 className="text-2xl font-bold text-slate-800">{roomName}</h2>
          
          <button 
            className="rounded-full border w-7 h-7 flex items-center justify-center hover:bg-gray-100 cursor-pointer text-slate-500 font-bold focus:outline-none transition-colors"
            onClick={() => setToggleMenu(!toggleMenu)}
          >   
            ⋮
          </button>  

          {toggleMenu && (
            <div className="absolute left-40 top-9 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 z-10 min-w-[140px]">
              <div className="text-[10px] text-slate-400 font-bold uppercase px-2 py-1 tracking-wider mb-0.5">
                Room Actions
              </div>
              <DeleteRoomButton roomId={currentRoomId} onDelete={deleteRoomAction} />    
            </div>
          )}             
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Created by Frank Diaz.</p>
      </div>

      <ExportExcelButton 
        roomName={roomName}
        stockedItems={stockedItems}
        floorItems={floorItems}
        recycleItems={recycleItems}
      />
    </div>
  );
}