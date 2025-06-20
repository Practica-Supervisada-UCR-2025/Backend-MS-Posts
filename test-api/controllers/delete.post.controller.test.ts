import { deleteOwnPostController } from "../../src/features/posts/controllers/post.controller";
import { deleteOwnPostService } from "../../src/features/posts/services/post.service";
import { Request, Response, NextFunction } from "express";

jest.mock("../../src/features/posts/services/post.service");

describe("deleteOwnPostController", () => {
  let mockReq: Partial<Request> & { user?: { uuid: string }; params?: { postId?: string } };
  let mockRes: Partial<Response>;
  let mockNext: NextFunction = jest.fn();

  beforeEach(() => {
    mockReq = {
      params: { postId: "post-123" },
      user: { uuid: "user-123" },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // it("should delete the post and return 200", async () => {
  //   (deleteOwnPostService as jest.Mock).mockResolvedValue({
  //     success: true,
  //     data: { postId: "post-123", deleted: true },
  //   });

  //   await deleteOwnPostController(mockReq as any, mockRes as any, mockNext);

  //   expect(mockRes.status).toHaveBeenCalledWith(200);
  //   expect(mockRes.json).toHaveBeenCalledWith({
  //     status: "success",
  //     message: "Post successfully deleted.",
  //     data: { postId: "post-123", deleted: true },
  //   });
  // });

  it("should return 400 if postId is missing", async () => {
    mockReq.params = {}; // 🔧 req.params existe pero sin postId

    await deleteOwnPostController(mockReq as any, mockRes as any, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: "error",
      message: "Valid Post ID is required.",
    });
  });

});
