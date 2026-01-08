import { bookFilterableFields } from "./book.constant";

export type TBookFilterAbleFields = Partial<
  Record<(typeof bookFilterableFields)[number], string | boolean>
>;
