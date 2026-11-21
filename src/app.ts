import express, { Request, Response } from "express";
import { globalErrorHandler } from "./common/middlewares/globalErrorHandler";

const app = express();

app.get("/", (req: Request, res: Response) => {
    res.json({ message: "Hello now building the catalog service...Lets go!" });
});

app.use(globalErrorHandler);

export default app;
