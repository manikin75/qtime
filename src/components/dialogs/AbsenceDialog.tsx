import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '../Dialog';
import { Button } from '../Button';

interface EditTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AbsenceDialog = ({ open, onOpenChange }: EditTokenDialogProps) => {
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="p-4">
          <DialogTitle>Absence</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          Absence data is stored locally in localStorage, and never sent to the
          server.
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="" onClick={handleCancel}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
