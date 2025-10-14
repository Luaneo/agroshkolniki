import { Hono } from "hono";
import { authMiddleware } from "./users/auth.js";
import z from "zod";

const app = new Hono();

app.use("*", authMiddleware);

app.post("/check_credentials/", async (c) => {
  return c.text("OK");
});

// TODO

export default app;
