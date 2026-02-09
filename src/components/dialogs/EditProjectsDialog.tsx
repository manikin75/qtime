import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { usePayzlip } from '../../hooks/usePayzlip';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useAtom(MyProjectsState);
  const { payzlipReady, getProjects } = usePayzlip();

  useEffect(() => {
    if (!payzlipReady) return;
    const projects = async () => {
      const p = await getProjects();
      setProjects(p);
      console.log(p);
    };
    // Populate projects from server
    projects();
  }, [payzlipReady]);

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
        <DialogHeader>
          <DialogTitle>Edit projects</DialogTitle>
          <DialogDescription>Add or remove projects</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
            {projects
              .filter((p) => !p.archived)
              .map((project) => (
                <div
                  key={project.id}
                  className="flex flex-row gap-2 justify-start items-start hover:bg-stone-200 p-1 rounded-md cursor-pointer"
                  onClick={() => handleChange(project)}
                >
                  <input
                    type="checkbox"
                    className="mt-1.5"
                    checked={
                      myProjects.filter((p) => p.id === project.id).length > 0
                    }
                  />
                  <div key={project.id}>
                    {project.name} {project.id}
                  </div>
                </div>
              ))}
          </div>
        </div>
        <DialogFooter className="bg-stone-500 p-4">
          <DialogClose asChild>
            <Button
              className="min-w-[100px]"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
