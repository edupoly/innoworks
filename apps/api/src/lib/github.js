import { App } from "octokit";
import axios from "axios";
import dotenv from 'dotenv';

dotenv.config();

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_PRIVATE_KEY;
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

let githubApp = null;

if (appId && privateKey) {
  try {
    githubApp = new App({
      appId,
      privateKey,
      webhooks: {
        secret: webhookSecret,
      },
    });
    console.log("✅ GitHub App initialized");
  } catch (error) {
    console.error("❌ Failed to initialize GitHub App:", error.message);
  }
} else {
  console.warn("⚠️ GitHub App ID or Private Key missing. GitHub features will be disabled.");
}

export { githubApp };

export const getInstallationOctokit = async (installationId) => {
  if (!githubApp) {
    throw new Error("GitHub App not initialized. Check your environment variables.");
  }
  return await githubApp.getInstallationOctokit(installationId);
};

export const createPullRequest = async (accessToken, owner, repo, title, body, head, base = 'main') => {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        title,
        body,
        head, // user:branch
        base,
      },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ GitHub PR Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create Pull Request");
  }
};

export const forkRepository = async (accessToken, owner, repo) => {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/forks`,
      {},
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ GitHub Fork Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to fork repository");
  }
};