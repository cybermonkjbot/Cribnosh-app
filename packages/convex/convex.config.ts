// @ts-nocheck
import { defineApp } from "convex/server";
import crons from "@convex-dev/crons/convex.config";
import resend from "@convex-dev/resend/convex.config";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(crons);
app.use(resend);
app.use(agent);

export default app;