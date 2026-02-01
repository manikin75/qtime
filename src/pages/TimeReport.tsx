import { useState } from 'react';
import { Layout } from '../components/Layout';
import { Calendar } from '../components/Calendar';
import { Button } from '../components/Button';
import { PlusIcon, PokerChipIcon } from '@phosphor-icons/react';
import { format } from 'date-fns';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { type Project } from '../types/project';

const defaultProjects: Project[] = [
  {
    id: '1',
    name: 'Project 1',
    description: 'This is a description of project 1',
  },
  {
    id: '2',
    name: 'Project 2',
    description: 'This is a description of project 2',
  },
  {
    id: '3',
    name: 'Project 3',
    description: 'This is a description of project 3',
  },
];

export const TimeReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [projects, setProjects] = useState<Project[]>(defaultProjects);

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

  const addProject = () => {
    setProjects((p) => [
      ...p,
      { id: p.length.toString(), name: `New project`, description: '' },
    ]);
  };

  return (
    <Layout>
      <div className="mt-10 flex flex-col items-center justify-start h-full">
        <div className="flex flex-row justify-between w-full">
          <Button
            size="sm"
            className="flex items-center justify-center"
            onClick={addProject}
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
          >
            <PokerChipIcon />
            Edit token
          </Button>
        </div>

        <Calendar year={year} month={month} projects={projects} />
      </div>
    </Layout>
  );
};
