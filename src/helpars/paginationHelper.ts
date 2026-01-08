type IOptions = {
  page?: number;
  limit?: number;
  sortOrder?: string;
  sortBy?: string;
};

type IOptionsResult = {
  page: number;
  limit: number;
  skip: number;
  //   sortBy: string;
  //   sortOrder: string;
  sortByCondition: Record<string, string>;
};

export const paginationField = ["limit", "page", "sortBy", "sortOrder"];
const calculatePagination = (options: IOptions): IOptionsResult => {
  const page: number = Number(options.page) || 1;
  const limit: number = Number(options.limit) || 10;
  const skip: number = (Number(page) - 1) * limit;

  const sortBy: string = options.sortBy || "createdAt";
  const sortOrder: string = options.sortOrder || "desc";

  const sortByCondition =
    sortBy && sortOrder
      ? {
          [sortBy]: sortOrder,
        }
      : {
          createdAt: "desc",
        };

  return {
    page,
    limit,
    skip,
    //   sortBy,
    //   sortOrder,
    sortByCondition,
  };
};

export const paginationHelper = {
  calculatePagination,
};
