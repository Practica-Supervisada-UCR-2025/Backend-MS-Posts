import { deleteOwnPostService } from "../../src/features/posts/services/post.service";
import { findPostById, deleteOwnPostRepository } from "../../src/features/posts/repositories/post.repository";

jest.mock("../../src/features/posts/repositories/post.repository");

describe("deleteOwnPostService", () => {
    const userId = "user-123";

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should delete the post successfully if it belongs to the user", async () => {
        (findPostById as jest.Mock).mockResolvedValue({
            id: "post-123",
            user_id: userId,
            is_active: true,
        });

        await expect(deleteOwnPostService(userId, "post-123")).resolves.toEqual({
            postId: "post-123",
            deleted: true,
        });

        expect(deleteOwnPostRepository).toHaveBeenCalledWith("post-123");
    });

    it("should throw 404 if the post does not exist", async () => {
        (findPostById as jest.Mock).mockResolvedValue(null);

        await expect(deleteOwnPostService(userId, "post-123")).rejects.toEqual({
            status: 404,
            message: "Post not found."
        });
    });

    it("should throw 403 if the post does not belong to the user", async () => {
        (findPostById as jest.Mock).mockResolvedValue({
            id: "post-123",
            user_id: "another-user",
            is_active: true,
        });

        await expect(deleteOwnPostService(userId, "post-123")).rejects.toEqual({
            status: 403,
            message: "You are not authorized to delete this post."
        });
    });

    it("should throw 400 if the post is already deleted", async () => {
        (findPostById as jest.Mock).mockResolvedValue({
            id: "post-123",
            user_id: userId,
            is_active: false,
        });

        await expect(deleteOwnPostService(userId, "post-123")).rejects.toEqual({
            status: 400,
            message: "This post is already deleted."
        });
    });
});
