import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { Layout } from '../components/Layout';
import { Calendar } from '../components/Calendar';
import { Button } from '../components/Button';
import { EditTokenDialog } from '../components/dialogs/EditTokenDialog';
import { AbsenceDialog } from '../components/dialogs/AbsenceDialog';
import { EditProjectsDialog } from '../components/dialogs/EditProjectsDialog';
import { usePayzlip } from '../hooks/usePayzlip';
import {
  PlusIcon,
  PokerChipIcon,
  CaretLeftIcon,
  CaretRightIcon,
} from '@phosphor-icons/react';
import { format } from 'date-fns';
import { MyProjectsState } from '../states/myProjects.state';
import { type Project } from '../types/project';

const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'Project 1',
    archived: false,
  },
  {
    id: '2',
    name: 'Project 2',
    archived: false,
  },
  {
    id: '3',
    name: 'Project 3',
    archived: false,
  },
];

export const TimeReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [projects, setProjects] = useState<Project[]>(defaultProjects);
  const [myProjects, setMyProjects] = useAtom(MyProjectsState);
  const [editTokenDialogOpen, setEditTokenDialogOpen] = useState(false);
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [editProjectsDialogOpen, setEditProjectsDialogOpen] = useState(false);
  const { payzlipReady, getProjects } = usePayzlip();

  useEffect(() => {
    if (!payzlipReady) return;
    const projects = async () => {
      const p = await getProjects();
      setProjects(p);
    };
    // Populate projects from server
    projects();
  }, [payzlipReady]);

  const changeMonth = (dir: 'left' | 'right') => {
    if (dir === 'left') {
      if (month === 0) {
        setYear((y) => y - 1);
        setMonth(11);
      } else {
        setMonth((m) => m - 1);
      }
    } else {
      if (month === 11) {
        setYear((y) => y + 1);
        setMonth(0);
      } else {
        setMonth((m) => m + 1);
      }
    }
  };

  return (
    <Layout>
      <div className="mb-10 mt-4 flex flex-col items-center justify-start h-full">
        <div className="flex flex-row justify-between w-full">
          <Button
            size="sm"
            className="flex items-center justify-center"
            onClick={() => setEditProjectsDialogOpen(true)}
          >
            <PlusIcon />
            Add Project
          </Button>
          <div className="flex flex-row items-center justify-center gap-6">
            <Button size="sm" className="" onClick={() => changeMonth('left')}>
              <CaretLeftIcon />
            </Button>
            <h2 className="font-bold ">
              {format(new Date(year, month, 1), 'MMMM yyyy')}
            </h2>
            <Button size="sm" className="" onClick={() => changeMonth('right')}>
              <CaretRightIcon />
            </Button>
          </div>
          <Button
            size="sm"
            className="flex items-center justify-center gap-x-1"
            onClick={() => setEditTokenDialogOpen(true)}
          >
            <PokerChipIcon />
            Edit token
          </Button>
        </div>

        <Calendar
          year={year}
          month={month}
          projects={myProjects}
          setAbsenceDialogOpen={setAbsenceDialogOpen}
        />
      </div>
      <EditTokenDialog
        open={editTokenDialogOpen}
        onOpenChange={setEditTokenDialogOpen}
      />
      <AbsenceDialog
        open={absenceDialogOpen}
        onOpenChange={setAbsenceDialogOpen}
      />
      <EditProjectsDialog
        open={editProjectsDialogOpen}
        onOpenChange={setEditProjectsDialogOpen}
      />
    </Layout>
  );
};
