import { ProjectWithPartialRelations } from './projectWithPartialRelations';

export type ProjectWithFavourite = Omit<
  ProjectWithPartialRelations,
  'is_favorite'
> & {
  is_favorite: boolean;
};
