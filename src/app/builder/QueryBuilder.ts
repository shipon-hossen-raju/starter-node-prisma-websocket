import { PrismaClient, Prisma } from "@prisma/client";

type QueryParams = Record<string, any>;
type IncludeFields = Record<string, boolean | object>;

class QueryBuilder<TModel extends keyof PrismaClient> {
  private model: any;
  private query: QueryParams;
  private prismaQuery: Prisma.SelectSubset<any, any> = {};

  constructor(model: PrismaClient[TModel], query: QueryParams) {
    this.model = model;
    this.query = query;
  }

  // Search
  search(searchableFields: string[]) {
    const searchTerm = this.query.searchTerm as string;
    if (searchTerm) {
      this.prismaQuery.where = {
        ...this.prismaQuery.where,
        OR: searchableFields.map((field) => ({
          [field]: { contains: searchTerm, mode: "insensitive" },
        })),
      };
    }
    return this;
  }

  // Filter
  // filter() {
  //   const queryObj = { ...this.query };
  //   const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
  //   excludeFields.forEach((field) => delete queryObj[field]);

  //   const formattedFilters: Record<string, any> = {};
  //   for (const [key, value] of Object.entries(queryObj)) {
  //     if (key.includes("[")) {
  //       const [field, operator] = key.split("[");
  //       const op = operator.replace("]", "");
  //       formattedFilters[field] = { [op]: parseFloat(value as string) };
  //     } else {
  //       formattedFilters[key] = value;
  //     }
  //   }

  //   this.prismaQuery.where = {
  //     ...this.prismaQuery.where,
  //     ...formattedFilters,
  //   };

  //   return this;
  // }
  filter() {
    const queryObj = { ...this.query };
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((field) => delete queryObj[field]);

    const formattedFilters: Record<string, any> = {};
    for (const [key, value] of Object.entries(queryObj)) {
      if (key.includes("[")) {
        const [field, operator] = key.split("[");
        const op = operator.replace("]", "");
        const parsed = isNaN(value as any)
          ? value
          : parseFloat(value as string);
        formattedFilters[field] = { [op]: parsed };
      } else {
        // 👇 auto-parse float if it's a number-like string
        const parsed = isNaN(value as any)
          ? value
          : parseFloat(value as string);
        formattedFilters[key] = parsed;
      }
    }

    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...formattedFilters,
    };

    return this;
  }

  // Custom filter (raw)
  rawFilter(filters: Record<string, any>) {
    this.prismaQuery.where = {
      ...this.prismaQuery.where,
      ...filters,
    };
    return this;
  }

  // Sorting
  sort() {
    const sort = (this.query.sort as string)?.split(",") || ["-createdAt"];
    const orderBy = sort.map((field) => {
      if (field.startsWith("-")) {
        return { [field.slice(1)]: "desc" };
      }
      return { [field]: "asc" };
    });

    this.prismaQuery.orderBy = orderBy;
    return this;
  }

  // Pagination
  paginate() {
    const page = Number(this.query.page) || 1;
    const limit = Number(this.query.limit) || 10;
    const skip = (page - 1) * limit;

    this.prismaQuery.skip = skip;
    this.prismaQuery.take = limit;

    return this;
  }

  // Field Selection
  fields() {
    const fields = (this.query.fields as string)?.split(",") || [];
    if (fields.length > 0) {
      this.prismaQuery.select = fields.reduce<Record<string, boolean>>(
        (acc, field) => {
          acc[field] = true;
          return acc;
        },
        {}
      );
    }
    return this;
  }

  // Include Related Models
  include(includeFields: IncludeFields) {
    this.prismaQuery.include = {
      ...this.prismaQuery.include,
      ...includeFields,
    };
    return this;
  }

  // Price Range
  priceRange(minPrice?: number, maxPrice?: number) {
    if (!this.prismaQuery.where) {
      this.prismaQuery.where = {};
    }

    this.prismaQuery.where.price = {};

    if (minPrice !== undefined) {
      this.prismaQuery.where.price.gte = minPrice;
    }

    if (maxPrice !== undefined) {
      this.prismaQuery.where.price.lte = maxPrice;
    }

    return this;
  }

  // Execute Query
  async execute() {
    return await this.model.findMany(this.prismaQuery);
  }

  // Count total items (ignores pagination)
  async countTotal() {
    const count = await this.model.count({
      where: this.prismaQuery.where,
    });
    return count;
  }
}

export default QueryBuilder;
