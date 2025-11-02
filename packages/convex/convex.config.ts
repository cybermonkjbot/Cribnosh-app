import { defineApp } from "convex/server";
import crons from "@convex-dev/crons/convex.config";
import resend from "@convex-dev/resend/convex.config";

const app = defineApp();
app.use(crons);
app.use(resend);

export default app;