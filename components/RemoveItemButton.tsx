'use client';

interface RemoveItemButtonProps {
  itemId: string;
  serialLast5: string;
  // Pass the Server Action down as a prop
  onConfirmDelete: (id: string) => Promise<void>;
}

export function RemoveItemButton({ itemId, serialLast5, onConfirmDelete }: RemoveItemButtonProps) {
  const handleMoveOut = async () => {
    // 1. Prompt the user for the confirmation phrase/serial
    const input = window.prompt(
      `To take out this item, confirm by typing its last 5 serial characters:"`
    );

    // 2. Cancel if they hit cancel or type it wrong
    if (input === null) return; // User cancelled
    
    if (input.trim().toUpperCase() !== serialLast5.toUpperCase()) {
      window.alert("❌ Serial number mismatch. Operation cancelled.");
      return;
    }

    // 3. Trigger the server action if it matches
    try {
      await onConfirmDelete(itemId);
    } catch (error) {
      window.alert("Something went wrong trying to remove the asset.");
    }
  };

  return (
    <button 
      onClick={handleMoveOut}
      className="p-2 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-full transition-colors focus:outline-none cursor-pointer"
      title="Take Out Item"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="18" 
        height="18" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className="lucide lucide-replace"
      >
        <path d="M14 4a1 1 0 0 1 1-1"/>
        <path d="M15 10a1 1 0 0 1-1-1"/>
        <path d="M21 4a1 1 0 0 0-1-1"/>
        <path d="M21 9a1 1 0 0 1-1 1"/>
        <path d="m3 7 3 3 3-3"/>
        <path d="M6 10V5a2 2 0 0 1 2-2h2"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
      </svg>
    </button>
  );
}