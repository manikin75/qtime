import { useAtom } from 'jotai';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogDescription,
} from '../Dialog';
import { Button } from '../Button';
import { TokenState } from '../../states/token.state';

interface EditTokenDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditTokenDialog = ({
  open,
  onOpenChange,
}: EditTokenDialogProps) => {
  const [token, setToken] = useAtom(TokenState);

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="p-4">
          <DialogTitle>Edit token</DialogTitle>
          <DialogDescription>
            Copy the token from the Payzlip app and paste here
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-row gap-4">
            <textarea
              className="w-full h-48 border border-stone-700 rounded-md p-2"
              placeholder="Token"
              value={token || ''}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="min-w-[100px]" onClick={handleCancel}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
