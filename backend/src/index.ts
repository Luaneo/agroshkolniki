import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authMiddleware, hashPassword } from "./users/auth.js";
import { saveImageToDb, sendImageToModel } from "./images/index.js";

const app = new Hono();

app.use("*", authMiddleware);

app.get("/check/", (c) => {
  return c.text("Success");
});

app.post("/images/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  if (typeof file === "string") {
    return c.text("Wrong format", 400);
  }

  // @ts-ignore
  saveImageToDb(file, Number(c.get("login")));
  sendImageToModel(file);
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    hashPassword("password").then((hashedPassword) => {
      console.log(`Hashed \`password\`: ${hashedPassword}`);
    });
  }
);
