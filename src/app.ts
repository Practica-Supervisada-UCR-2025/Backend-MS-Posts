import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './utils/errors/error-handler.middleware';
import cors from "cors";
import postRoutes from './features/posts/routes/post.routes';
import reportedPostsRoutes from './features/posts/routes/reportedPosts.routes';
import reportRoutes from './features/reports/routes/reports.routes';

export const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Server is running on port 3000');
});
app.use(express.json());
app.use(cors());

// Add the user posts routes
app.use('/api', postRoutes);
app.use('/api', reportedPostsRoutes);
app.use('/api', reportRoutes);

// Error handling middleware should be last
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});