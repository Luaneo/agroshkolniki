import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { authMiddleware, hashPassword } from "./users/auth.js";
import { saveImageToS3, sendImageToModel } from "./images/index.js";
import { cors } from "hono/cors";
import rnapp from "./rnapp.js";

const app = new Hono();

app.use(cors());

app.get("/health/", (c) => {
  return c.text("Available.");
});

app.route("/rnapp/", rnapp);

app.post("/images/", async (c) => {
  console.log("/images/ endpoint was called");
  const body = await c.req.parseBody();
  const file = body["file"];
  if (typeof file === "string") {
    console.log(JSON.stringify(file));
    return c.text("Wrong format", 400);
  }

  // @ts-ignore
  saveImageToDb(file, Number(c.get("login")));
  console.log(await sendImageToModel(file));
  console.log(file);
  return c.text("Image received");
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
