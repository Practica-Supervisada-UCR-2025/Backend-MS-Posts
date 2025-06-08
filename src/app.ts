// Do NOT remove or move this appdynamics require, it must be on the first line, or else it will not work
require("appdynamics").profile({
 controllerHostName: process.env.APP_DYNAMICS_HOST,
 controllerPort: 443,
 // If SSL, be sure to enable the next line
 controllerSslEnabled: true,
 accountName: process.env.APP_DYNAMICS_ACCOUNT_NAME,
 accountAccessKey: process.env.APP_DYNAMICS_KEY,
 applicationName: 'Backend-posts-app',
 tierName: 'Backend-posts-tier',
 nodeName: 'process' // The controller will automatically append the node name with a unique number
});
import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './utils/errors/error-handler.middleware';
import cors from "cors";
import postRoutes from './features/posts/routes/post.routes';
import reportedPostsRoutes from './features/posts/routes/reportedPosts.routes';

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

// Error handling middleware should be last
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});