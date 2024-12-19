import { Category } from '@prisma/client';

export enum SortType {
  ASC = 'asc',
  DESC = 'desc',
}

export function getSortType(sortType?: string): string {
  if (
    sortType &&
    Object.values(SortType).includes(sortType.toLowerCase().trim() as SortType)
  ) {
    return sortType.toLowerCase().trim();
  }
  return SortType.ASC;
}

export function parseEnumCategory(category: string): Category | undefined {
  if (Object.values(Category).includes(category as Category)) {
    return category as Category;
  }
  return undefined;
}
