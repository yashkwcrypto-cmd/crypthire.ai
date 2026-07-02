import express, { Request, Response } from "express";

const router = express.Router();

router.get("/admin", (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: "Hello from Express!",
        data: {
            id: 1,
            name: "Yash",
            role: "Admin"
        }
    });
});

router.post("/", (req: Request, res: Response) => {
    const body = req.body;

    res.status(201).json({
        success: true,
        message: "User created",
        data: body
    });
});

export default router;