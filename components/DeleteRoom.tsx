'use client';

interface DeleteRoomButtonProps {
  roomId: string;
  onDelete: (id: string) => Promise<void>;
}

export function DeleteRoomButton({ roomId, onDelete }: DeleteRoomButtonProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const confirmed = window.confirm(
      "⚠️ WARNING: Are you sure you want to completely delete this room? All associated items will be permanently erased!"
    );
    
    if (confirmed) {
      await onDelete(roomId);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button 
        type="submit" 
        className="text-xs border text-red-500 border-red-200 hover:bg-red-50 px-2 py-1 rounded transition-colors font-medium"
      >
        Delete Room 🗑️
      </button>
    </form>
  );
}