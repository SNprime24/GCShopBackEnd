import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/features.js';
import cookieParser from 'cookie-parser';
import customerRoute from './routers/customerRouter.js';
import productsRoute from './routers/productsRouter.js';
import orderRoute from './routers/orderRouter.js';
import { errorMiddleware } from './middlewares/error.js';

const corsOptions = {
    origin: [ "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}

dotenv.config({
    path: "./config.env",
})

const mongoURI = process.env.MONGO_URI;
const port = process.env.PORT || 3012;

connectDB(mongoURI);

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());
app.use(cors(corsOptions));

app.use('/api/v1/customer', customerRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/products', productsRoute);

app.get('/', (req, res) => {
    res.send("This is IIT BBS");
})

app.use(errorMiddleware);

server.listen(port, () => {
    console.log(`Server is listening successfully at port ${port}`);
})