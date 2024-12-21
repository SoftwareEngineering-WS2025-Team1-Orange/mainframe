export class Pagination {
  totalResults: number;

  filteredResults: number;

  currentPage: number;

  pageSize: number;

  numberOfPages: number;

  constructor(
    totalResults: number,
    filteredResults: number,
    pageSize: number,
    currentPage: number,
  ) {
    this.totalResults = totalResults;
    this.filteredResults = filteredResults;
    this.currentPage = currentPage;
    this.pageSize = pageSize;
    this.numberOfPages = Math.max(1, Math.ceil(filteredResults / pageSize));
  }

  constructPaginationQueryObject() {
    return {
      skip: (this.currentPage - 1) * this.pageSize,
      take: this.pageSize,
    };
  }
}

export enum PaginationQueryArguments {
  pageSize = 'pagination_page_size',
  page = 'pagination_page',
}
