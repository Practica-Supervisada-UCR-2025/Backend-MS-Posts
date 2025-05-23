import express, { Request, Response, NextFunction } from 'express';
import { errorHandler } from './utils/errors/error-handler.middleware';
import cors from "cors";
import postRoutes from './features/posts/routes/post.routes'; // Adjust the path if your routes file is elsewhere

export const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send('Server is running on port 3000');
});
app.use(express.json());
app.use(cors());
app.use('/api', postRoutes);

// Error handling middleware should be last
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});