import { useAtom } from 'jotai';
import { usePayzlip } from '../../hooks/usePayzlip';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from '../Dialog';
import { Button } from '../Button';
import { MyProjectsState } from '../../states/myProjects.state';
import { type Project } from '../../types/project';

interface EditProjectsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProjectsDialog = ({
  open,
  onOpenChange,
}: EditProjectsDialogProps) => {
  const [myProjects, setMyProjects] = useAtom(MyProjectsState);
  const { projects, isLoadingProjects } = usePayzlip();

  const handleChange = (project: Project) => {
    if (!myProjects || !myProjects.find((p) => p.id === project.id)) {
      setMyProjects((prev) => [...prev, { ...project }]);
      return;
    } else {
      setMyProjects((prev) => prev.filter((p) => p.id !== project.id));
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="p-4">
          <DialogTitle>Select your projects</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
            {isLoadingProjects ? (
              <span>Loading...</span>
            ) : (
              projects
                ?.filter((p) => !p.archived)
                .map((project: Project) => (
                  <div
                    key={project.id || 'default'}
                    className="flex flex-row gap-2 justify-start items-start hover:bg-stone-600 px-1 rounded-md cursor-pointer"
                    onClick={() => handleChange(project)}
                  >
                    <input
                      type="checkbox"
                      className="mt-1.5"
                      checked={
                        myProjects?.filter((p) => p.id === project.id).length >
                        0
                      }
                      onChange={() => {}}
                    />
                    <div>{project.name}</div>
                  </div>
                ))
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="min-w-25" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
