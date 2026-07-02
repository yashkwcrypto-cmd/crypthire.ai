import { test, describe } from "node:test";
import assert from "node:assert";
import { POST } from "./route";
import { NextRequest } from "next/server";

describe("Auth API Route", () => {
    test("POST - creates user successfully", async () => {
        const payload = { username: "john_doe", email: "john@example.com" };
        
        const req = new NextRequest("http://localhost:3000/api/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const response = await POST(req);
        assert.strictEqual(response.status, 201);

        const data = await response.json();
        assert.deepStrictEqual(data, {
            success: true,
            message: "User created",
            data: payload
        });
    });
});
