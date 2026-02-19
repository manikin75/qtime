import { type Project } from '../types/project';
import { atomWithStorage } from 'jotai/utils';

export const DefaultProject: Project = {
  id: null,
  name: 'Ordinarie arbetstid',
  archived: false,
};

export const MyProjectsState = atomWithStorage<Project[]>('myProjects', [
  DefaultProject,
]);
