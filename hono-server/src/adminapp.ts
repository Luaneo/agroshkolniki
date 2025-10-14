import { Hono } from "hono";
import { authMiddleware, getUserIdFromContext } from "./users/auth.js";

const app = new Hono();

app.use("*", authMiddleware);

app.post("/check_credentials/", async (c) => {
  return c.text("OK");
});

app.post("/shifts/create/", async (c) => {
  const submitterId = getUserIdFromContext(c);

  
})

export default app;
