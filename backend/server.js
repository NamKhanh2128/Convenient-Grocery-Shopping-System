import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRequired } from './src/middleware/auth.js';
import shoppingRoutes from './src/routes/shoppingRoutes.js';
import { AuthController } from './src/controllers/AuthController.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', AuthController.router);

app.use(authRequired);

app.use('/shopping-lists', shoppingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy tài nguyên.' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend đang chạy tại http://localhost:${PORT}`);
});
