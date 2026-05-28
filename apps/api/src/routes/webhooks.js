import { Router } from "express";
import { githubApp } from '../lib/github.js';

const router = Router();

router.post("/", async (req, res) => {
  if (!githubApp) {
    return res.status(503).json({ message: "GitHub features are currently disabled" });
  }

  try {
    const id = req.headers["x-github-delivery"];
    const name = req.headers["x-github-event"];
    const signature = req.headers["x-hub-signature-256"];
    const payload = JSON.stringify(req.body);

    await githubApp.webhooks.verifyAndReceive({
      id,
      name: name,
      signature,
      payload,
    });

    res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ message: "Webhook failed" });
  }
});

if (githubApp) {
  githubApp.webhooks.on("push", async ({ payload }) => {
    console.log("Push event received:", payload.repository.full_name);
    // Logic to track commits/activity
  });

  githubApp.webhooks.on("pull_request", async ({ payload }) => {
    console.log("Pull Request event received:", payload.action);
    // Logic to track PR status
  });
}

export default router;
