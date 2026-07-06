// src/app/page.tsx
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { CollapsibleTable } from '@/components/CollapsibleTable';
import { RoomHeader } from '@/components/RoomHeader';
import { ExcelUploader } from '@/components/ExcelUploader';

interface PageProps {
  searchParams: Promise<{ 
    room?: string; 
    search?: string; 
    sortBy?: string; 
    order?: 'asc' | 'desc' 
  }>;
}

// --- SERVER ACTIONS ---
async function createRoom(formData: FormData) {
  'use server';
  const name = formData.get('name') as string;
  const location = formData.get('location') as string;
  if (!name || !location) return;

  await db.room.create({ data: { name, location } });
  revalidatePath('/');
}

async function deleteRoom(roomId: string) {
  'use server';
  if (!roomId) return;
  try {
    await db.room.delete({ where: { id: roomId } });
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to delete room:", error);
  }
}

async function deleteItem(itemId: string) {
  'use server';
  try {
    await db.item.delete({ where: { id: itemId } });
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to delete item:", error);
  }
}

async function updateItemStatus(itemId: string, newStatus: string, assignedTo?: string) {
  'use server';
  try {
    await db.item.update({
      where: { id: itemId },
      data: { 
        status: newStatus,
        assignedTo: newStatus === 'FLOOR' ? assignedTo || null : null
      }
    });
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to update item status:", error);
  }
}

async function createItem(formData: FormData) {
  'use server';
  const brand = formData.get('brand') as string;
  const model = formData.get('model') as string;
  const condition = formData.get('condition') as string;
  const serialLast5 = formData.get('serialLast5') as string;
  const roomId = formData.get('roomId') as string;
  const notes = formData.get('notes') as string; // Read notes value

  if (!brand || !model || !roomId) return;

  await db.item.create({
    data: {
      brand,
      model,
      condition,
      serialLast5,
      roomId,
      status: 'STOCKED',
      // Saving cleanly into the flexible Postgres JSONB object block
      specs: { notes: notes || 'N/A' },
    },
  });
  revalidatePath('/');
}

async function updateItemCondition(itemId: string, newCondition: string) {
  'use server';
  try {
    await db.item.update({
      where: { id: itemId },
      data: { condition: newCondition }
    });
    revalidatePath('/');
  } catch (error) {
    console.error("Failed to update item condition:", error);
  }
}

async function uploadBulkItems(roomId: string, rawItems: any[]) {
  'use server';
  if (!roomId || !rawItems || rawItems.length === 0) return;

  try {
    const sanitizedData = rawItems.map((row) => ({
      brand: String(row.Brand || row.brand || '').trim(),
      model: String(row.Model || row.model || '').trim(),
      condition: String(row.Condition || row.condition || 'Excellent').trim(),
      serialLast5: String(row.Serial || row.serial || '').trim().slice(0, 5),
      status: 'STOCKED',
      roomId: roomId,
      // Fallback fallback configurations: matches 'Notes', 'notes', 'CPU', or 'cpu' headers
      specs: { notes: row.Notes || row.notes || row.CPU || row.cpu || 'N/A' },
    })).filter(item => item.brand && item.model && item.serialLast5);

    if (sanitizedData.length === 0) return;

    await db.item.createMany({
      data: sanitizedData,
      skipDuplicates: true,
    });

    revalidatePath('/');
  } catch (error) {
    console.error("Failed to execute bulk asset upload:", error);
  }
}

export default async function InventoryDashboard({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const activeRoomId = resolvedParams.room || '';
  const searchQuery = resolvedParams.search || '';
  const sortBy = resolvedParams.sortBy || 'createdAt';
  const order = resolvedParams.order || 'desc';

  const rooms = await db.room.findMany({ orderBy: { name: 'asc' } });
  const currentRoomId = activeRoomId || rooms[0]?.id;

  const allItems = currentRoomId
    ? await db.item.findMany({
        where: {
          roomId: currentRoomId,
          OR: searchQuery
            ? [
                { brand: { contains: searchQuery, mode: 'insensitive' } },
                { model: { contains: searchQuery, mode: 'insensitive' } },
                { serialLast5: { contains: searchQuery, mode: 'insensitive' } },
                { condition: { contains: searchQuery, mode: 'insensitive' } },
                { assignedTo: { contains: searchQuery, mode: 'insensitive' } },
              ]
            : undefined,
        },
        orderBy: { [sortBy]: order },
      })
    : [];

  const stockedItems = allItems.filter((i: any) => i.status === 'STOCKED' || !i.status);
  const floorItems = allItems.filter((i: any) => i.status === 'FLOOR');
  const recycleItems = allItems.filter((i: any) => i.status === 'RECYCLE');

  const currentRoom = rooms.find((r: any) => r.id === currentRoomId);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900">
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900 text-white p-6 flex flex-col justify-between">
        <div>
          <div className='flex flex-row justify-center items-center mb-8'>
              <img src="/dl-inv-logo.png" alt="DoorLoop Inventory Logo" className='w-12 h-12'/>
              <h1 className="text-xl font-bold tracking-tight">DoorLoop Inventory</h1>
          </div>
          
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Room</h2>
          <div className="space-y-1">
            {rooms.map((room: any) => (
              <a
                key={room.id}
                href={`/?room=${room.id}`}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  currentRoomId === room.id ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {room.name} <span className="text-xs opacity-60">({room.location})</span>
              </a>
            ))}
            {rooms.length === 0 && <p className="text-sm text-slate-500 italic p-2">No rooms created yet.</p>}
          </div>
        </div>

        <form action={createRoom} className="border-t border-slate-800 pt-4 mt-4 space-y-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase">Create New Room</h3>
          <input type="text" name="name" placeholder="Room Name (e.g. Tokyo)" className="w-full text-xs p-2 bg-slate-800 rounded border border-slate-700 text-white" required />
          <input type="text" name="location" placeholder="Country / City" className="w-full text-xs p-2 bg-slate-800 rounded border border-slate-700 text-white" required />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-2 rounded font-medium">Add Room</button>
        </form>
      </aside>

      {/* MAIN LAYOUT AREA */}
      <main className="flex-1 p-8 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
            <h2 className="text-xl font-medium text-slate-600">Welcome! Begin by adding your first Room in the sidebar.</h2>
          </div>
        ) : (
          <>
            <RoomHeader 
              roomName={currentRoom?.name || 'Inventory'} 
              currentRoomId={currentRoomId} 
              deleteRoomAction={deleteRoom} 
              stockedItems={stockedItems}
              floorItems={floorItems}
              recycleItems={recycleItems}
            />
            {/* Search Bar */}
            <div className="mb-6">
              <form method="GET" className="flex items-center gap-2 max-w-xl">
                {/* Hidden inputs ensure we maintain our active room scope when applying filters */}
                <input type="hidden" name="room" value={currentRoomId} />
                {/* Maintain sorting fields structure if any is active */}
                {resolvedParams.sortBy && <input type="hidden" name="sortBy" value={resolvedParams.sortBy} />}
                {resolvedParams.order && <input type="hidden" name="order" value={resolvedParams.order} />}
                
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none select-none">
                    🔍
                  </span>
                  <input 
                    type="text" 
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Search brand, model, serial, condition, or user..." 
                    className="w-full h-10 pl-9 pr-4 text-sm bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  Search
                </button>

                {searchQuery && (
                  <a 
                    href={`/?room=${currentRoomId}`}
                    className="h-10 px-3 flex items-center justify-center border bg-white hover:bg-slate-50 text-slate-500 text-xs font-medium rounded-xl transition-colors"
                    title="Clear Search Filter"
                  >
                    Clear
                  </a>
                )}
              </form>
            </div>
            <div className="grid grid-cols-3 gap-8 items-start">
              <div className="col-span-2 space-y-8">
                <CollapsibleTable 
                  title="Stocked Items"
                  items={stockedItems}
                  statusContext="STOCKED"
                  currentRoomId={currentRoomId}
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  order={order}
                  updateItemStatus={updateItemStatus}
                  updateItemCondition={updateItemCondition}
                  deleteItem={deleteItem}
                />

                <CollapsibleTable 
                  title="Items in Floor"
                  items={floorItems}
                  statusContext="FLOOR"
                  currentRoomId={currentRoomId}
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  order={order}
                  updateItemStatus={updateItemStatus}
                  updateItemCondition={updateItemCondition}
                  deleteItem={deleteItem}
                />

                <CollapsibleTable 
                  title="Items to Recycle"
                  items={recycleItems}
                  statusContext="RECYCLE"
                  currentRoomId={currentRoomId}
                  searchQuery={searchQuery}
                  sortBy={sortBy}
                  order={order}
                  updateItemStatus={updateItemStatus}
                  updateItemCondition={updateItemCondition}
                  deleteItem={deleteItem}
                />
              </div>

              {/* RIGHT SIDEBAR */}
              <div className="bg-white p-6 rounded-xl shadow-sm border h-fit sticky top-0">
                <h3 className="font-semibold mb-4">Log New Asset</h3>
                <form action={createItem} className="space-y-4 text-sm">
                  <input type="hidden" name="roomId" value={currentRoomId} />
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
                    <input type="text" name="brand" placeholder="e.g. Apple, Dell" className="w-full p-2 border rounded" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Model</label>
                    <input type="text" name="model" placeholder="e.g. MacBook Pro M3" className="w-full p-2 border rounded" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Condition</label>
                      <select name="condition" className="w-full p-2 border rounded bg-white">
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Bad">Bad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Serial (Last 5)</label>
                      <input type="text" name="serialLast5" maxLength={5} placeholder="A1B2C" className="w-full p-2 border rounded font-mono" required />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Asset Notes / Comments</label>
                    <input 
                      type="text" 
                      name="notes" 
                      placeholder="e.g. Asset deployed on loan, battery swapped" 
                      className="w-full p-2 border rounded text-xs" 
                    />
                  </div>
                  
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium mt-2">
                    Save to Database
                  </button>
                </form>
                <ExcelUploader 
                  roomId={currentRoomId} 
                  onUploadSuccess={uploadBulkItems} 
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}