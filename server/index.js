import express from "express";
import "dotenv/config";
import cors from 'cors';

import advice from "./routes/advice.js";
import chat from "./routes/chat.js";

const app = express();
const PORT = process.env.EXPRESS_PORT || 8000;

try {
    app.listen(PORT, () => {
        console.log(`Webserver started at port ${PORT}`);
    });
} catch (error) {
    console.error('Error:', error.message);
}

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());
app.use(express.json()); // Parse JSON requests

app.use('/advice', advice);
app.use('/chat', chat);