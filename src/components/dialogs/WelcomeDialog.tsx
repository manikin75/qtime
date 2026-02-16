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

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WelcomeDialog = ({ open, onOpenChange }: WelcomeDialogProps) => {
  const handleCancel = () => {
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="p-4">
          <DialogTitle>Welcome to QTime</DialogTitle>
          <DialogDescription>
            QTime is a frontend for Payzlip. It's a simple alternative meant for
            easier interaction and providing a better overview.
          </DialogDescription>
        </DialogHeader>
        <div className="p-4 flex flex-col gap-4">
          <p>
            To get started, you need a token from Payzlip. This token is used to
            authenticate with the API and fetch your projects. Enter the token
            in the "Edit token" dialog.
          </p>
          <p>
            You can find your token in the Payzlip app cookies, under the
            name&nbsp;
            <b>refreshToken</b>.
          </p>
          <p>
            Once completed, you can add your projects and start tracking your
            time.
          </p>
        </div>

        <DialogFooter className="bg-stone-500 p-4">
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
