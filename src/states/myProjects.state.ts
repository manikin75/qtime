import { type Project } from '../types/project';
import { atomWithStorage } from 'jotai/utils';

export const MyProjectsState = atomWithStorage<Project[]>('myProjects', []);
