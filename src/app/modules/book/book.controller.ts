import httpStatus from "http-status";
import { paginationField } from "../../../helpars/paginationHelper";
import catchAsync from "../../../shared/catchAsync";
import { pick } from "../../../shared/pick";
import sendResponse from "../../../shared/sendResponse";
import { bookFilterableFields } from "./book.constant";
import { bookService } from "./book.service";

const createBook = catchAsync(async (req, res) => {
  const result = await bookService.createIntoDb(req);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Book created successfully",
    data: result,
  });
});

const getBookList = catchAsync(async (req, res) => {
  const filters = pick(req.query, bookFilterableFields) as Record<
    string,
    string
  >;
  const options = pick(req.query, paginationField);
  const userRole = req.user?.role;

  const result = await bookService.getListFromDb(filters, options, userRole);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Book list retrieved successfully",
    data: result,
  });
});

const getBookById = catchAsync(async (req, res) => {
  const result = await bookService.getByIdFromDb(req.params.id, req.user?.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Book details retrieved successfully",
    data: result,
  });
});

const updateBook = catchAsync(async (req, res) => {
  const bookId = req.params.id;
  const body = JSON.parse(req.body.data || "{}");
  const files = req.files as Record<string, Express.Multer.File[]>;

  const result = await bookService.updateIntoDb(bookId, body, files);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Book updated successfully",
    data: result,
  });
});

const deleteBook = catchAsync(async (req, res) => {
  const result = await bookService.deleteItemFromDb(req.params.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Book deleted successfully",
    data: result,
  });
});

export const bookController = {
  createBook,
  getBookList,
  getBookById,
  updateBook,
  deleteBook,
};
