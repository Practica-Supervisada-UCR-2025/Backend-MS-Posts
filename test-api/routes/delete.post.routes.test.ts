import request from "supertest";
import express from "express";
import { deleteOwnPostController } from "../../src/features/posts/controllers/post.controller";
import postRoutes from "../../src/features/posts/routes/post.routes";
import { authenticateJWT } from "../../src/features/middleware/authenticate.middleware";

jest.mock("../../src/features/posts/controllers/post.controller");
jest.mock("../../src/features/middleware/authenticate.middleware");

const app = express();
app.use(express.json());
app.use("/api", postRoutes);

describe("POST /api/user/posts/delete", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should call the controller for an authenticated user", async () => {
        (authenticateJWT as jest.Mock).mockImplementation((req, res, next) => {
            req.user = { uuid: "user-123" };
            next();
        });

        (deleteOwnPostController as jest.Mock).mockImplementation((req, res) => {
            res.status(200).json({ status: "success", message: "Post successfully deleted." });
        });

        const response = await request(app)
            .delete("/api/user/posts/delete")
            .send({ postId: "post-123" });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: "success", message: "Post successfully deleted." });
        expect(deleteOwnPostController).toHaveBeenCalled();
    });

    it("should block unauthenticated users", async () => {
        (authenticateJWT as jest.Mock).mockImplementation((req, res) => {
            res.status(401).json({ status: "error", message: "Unauthorized" });
        });

        const response = await request(app)
            .delete("/api/user/posts/delete")
            .send({ postId: "post-123" });

        expect(response.status).toBe(401);
        expect(response.body).toEqual({ status: "error", message: "Unauthorized" });
    });
});
