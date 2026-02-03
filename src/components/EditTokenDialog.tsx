import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from './Dialog';
import { Button } from './Button';

interface EditTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTokenDialog = ({
  open,
  onOpenChange,
}: EditTokenDialogProps) => {
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>Edit token</DialogTitle>
        <DialogDescription>Lorem ipsum dolor sit amet</DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <input type="text" placeholder="Token" />
            <Button>Save</Button>
          </div>
          <div className="flex flex-row gap-4">
            <Button>Cancel</Button>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button onClick={() => console.log('close')}>Close</Button>
        <DialogClose asChild>
          <Button className="min-w-[100px]" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogClose>
      </DialogFooter>
    </Dialog>
  );
};
