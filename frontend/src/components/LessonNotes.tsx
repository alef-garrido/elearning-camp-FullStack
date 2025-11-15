import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';

interface LessonNotesProps {
  lessonId?: string;
  initialNotes?: string;
  onSave: (notes: string) => Promise<void>;
  onDelete: () => Promise<void>;
}

const LessonNotes = ({
  lessonId,
  initialNotes = '',
  onSave,
  onDelete,
}: LessonNotesProps) => {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(notes);
      setSavedMessage('Notes saved!');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save notes', error);
      setSavedMessage('Failed to save notes');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete these notes?')) {
      return;
    }
    setIsDeleting(true);
    try {
      await onDelete();
      setNotes('');
      setSavedMessage('Notes deleted');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (error) {
      console.error('Failed to delete notes', error);
      setSavedMessage('Failed to delete notes');
      setTimeout(() => setSavedMessage(''), 3000);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold mb-3">Lesson Notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add notes about this lesson..."
        className="w-full h-32 p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex items-center justify-between gap-2 mt-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save Notes'}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || !notes}
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
        {savedMessage && (
          <span className={`text-sm ${savedMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
            {savedMessage}
          </span>
        )}
      </div>
    </div>
  );
};

export default LessonNotes;
