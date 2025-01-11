import { ProjectWithPartialRelations } from './projectWithPartialRelations';

export type ProjectWithFavourite = ProjectWithPartialRelations & {
  is_favorite: boolean;
};
