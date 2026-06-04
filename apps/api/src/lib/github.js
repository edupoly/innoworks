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
    const errorData = error.response?.data;
    console.error("❌ GitHub PR Error:", errorData || error.message);
    
    let errorMessage = errorData?.message || "Failed to create Pull Request";
    if (errorData?.errors) {
      const details = errorData.errors.map(e => e.message).join(", ");
      errorMessage += `: ${details}`;
    }
    
    throw new Error(errorMessage);
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

/**
 * Create a review on a GitHub Pull Request
 */
export const createPullRequestReview = async (accessToken, owner, repo, pullNumber, event, body) => {
  try {
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/reviews`,
      {
        body,
        event, // APPROVE, REQUEST_CHANGES, or COMMENT
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
    console.error("❌ GitHub PR Review Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create PR review");
  }
};

/**
 * Merge a GitHub Pull Request
 */
export const mergePullRequest = async (accessToken, owner, repo, pullNumber, commitTitle, commitMessage) => {
  try {
    const response = await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/merge`,
      {
        commit_title: commitTitle,
        commit_message: commitMessage,
        merge_method: "squash", // Default to squash for clean history
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
    console.error("❌ GitHub PR Merge Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to merge PR");
  }
};

/**
 * Close a GitHub Issue
 */
export const closeIssue = async (accessToken, owner, repo, issueNumber) => {
  try {
    const response = await axios.patch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`,
      { state: "closed" },
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ GitHub Close Issue Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to close issue");
  }
};

// --- GITHUB REPOSITORY INTELLIGENCE VIA GRAPHQL ---

/**
 * Execute a GraphQL query on the GitHub API
 */
export const runGraphQL = async (accessToken, query, variables = {}) => {
  try {
    const response = await axios.post(
      "https://api.github.com/graphql",
      { query, variables },
      {
        headers: {
          Authorization: `bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );
    if (response.data.errors) {
      throw new Error(response.data.errors.map((e) => e.message).join(", "));
    }
    return response.data.data;
  } catch (error) {
    console.error("❌ GitHub GraphQL Execution Error:", error.message);
    throw error;
  }
};

const REPO_INTELLIGENCE_QUERY = `
  query GetRepoIntelligence($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      name
      description
      owner {
        login
        avatarUrl
        url
      }
      url
      stargazerCount
      forkCount
      watchers {
        totalCount
      }
      defaultBranchRef {
        name
        target {
          ... on Commit {
            history(first: 100) {
              totalCount
              nodes {
                oid
                messageHeadline
                committedDate
                author {
                  name
                  avatarUrl
                  user {
                    login
                  }
                }
              }
            }
          }
        }
      }
      licenseInfo {
        name
        key
      }
      repositoryTopics(first: 20) {
        nodes {
          topic {
            name
          }
        }
      }
      languages(first: 10) {
        edges {
          size
          node {
            name
            color
          }
        }
      }
      object(expression: "HEAD:README.md") {
        ... on Blob {
          text
        }
      }
      releases(first: 10, orderBy: {field: CREATED_AT, direction: DESC}) {
        totalCount
        nodes {
          tagName
          name
          publishedAt
        }
      }
      refs(first: 50, refPrefix: "refs/tags/") {
        totalCount
        nodes {
          name
        }
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      openPRs: pullRequests(states: OPEN) {
        totalCount
      }
      closedPRs: pullRequests(states: MERGED) {
        totalCount
      }
      issuesList: issues(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          number
          title
          state
          createdAt
          closedAt
          assignees(first: 5) {
            nodes {
              login
            }
          }
          labels(first: 10) {
            nodes {
              name
              color
            }
          }
        }
      }
      pullRequestsList: pullRequests(first: 50, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          number
          title
          state
          createdAt
          mergedAt
          closedAt
          url
          author {
            login
            avatarUrl
          }
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  state
                  contexts(first: 20) {
                    nodes {
                      ... on CheckRun {
                        name
                        status
                        conclusion
                        url
                      }
                      ... on StatusContext {
                        context
                        state
                        targetUrl
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetch extensive Live Repository Metadata and statistics using the GitHub GraphQL API
 */
export const fetchGraphQLRepositoryIntelligence = async (accessToken, owner, repo) => {
  if (!accessToken) {
    throw new Error("GitHub user access token is required for GraphQL intelligence queries.");
  }
  
  const rawData = await runGraphQL(accessToken, REPO_INTELLIGENCE_QUERY, { owner, name: repo });
  const repository = rawData.repository;

  if (!repository) {
    throw new Error(`Repository not found or inaccessible: ${owner}/${repo}`);
  }

  // Parse and aggregate analytics in-memory
  const topics = repository.repositoryTopics?.nodes?.map(n => n.topic.name) || [];
  const languagesList = repository.languages?.edges?.map(e => ({
    name: e.node.name,
    color: e.node.color,
    size: e.size
  })) || [];

  // Commit history aggregates
  const commitNodes = repository.defaultBranchRef?.target?.history?.nodes || [];
  const totalCommitsCount = repository.defaultBranchRef?.target?.history?.totalCount || 0;
  
  // Calculate top commit contributors and frequency
  const contributorsMap = {};
  commitNodes.forEach(c => {
    const authorName = c.author?.user?.login || c.author?.name || "Anonymous";
    const avatar = c.author?.avatarUrl;
    if (!contributorsMap[authorName]) {
      contributorsMap[authorName] = { username: authorName, avatarUrl: avatar, commitCount: 0 };
    }
    contributorsMap[authorName].commitCount += 1;
  });

  const topContributors = Object.values(contributorsMap).sort((a, b) => b.commitCount - a.commitCount);

  // Parse issue types & aggregates
  const issueNodes = repository.issuesList?.nodes || [];
  const goodFirstIssues = issueNodes.filter(i => i.labels?.nodes?.some(l => l.name.toLowerCase().includes("good first"))).length;
  const bugIssues = issueNodes.filter(i => i.labels?.nodes?.some(l => l.name.toLowerCase().includes("bug"))).length;
  const docIssues = issueNodes.filter(i => i.labels?.nodes?.some(l => l.name.toLowerCase().includes("doc"))).length;
  const featureIssues = issueNodes.filter(i => i.labels?.nodes?.some(l => l.name.toLowerCase().includes("feat"))).length;
  const enhancementIssues = issueNodes.filter(i => i.labels?.nodes?.some(l => l.name.toLowerCase().includes("enhance"))).length;

  const assignedIssues = issueNodes.filter(i => i.assignees?.nodes?.length > 0).length;
  const unassignedIssues = issueNodes.filter(i => i.assignees?.nodes?.length === 0).length;

  // Parse PR aggregates
  const prNodes = repository.pullRequestsList?.nodes || [];
  const totalPrs = prNodes.length;
  const mergedPrs = prNodes.filter(p => p.state === "MERGED").length;
  const openPrs = prNodes.filter(p => p.state === "OPEN").length;
  const rejectedPrs = prNodes.filter(p => p.state === "CLOSED" && !p.mergedAt).length;

  return {
    overview: {
      name: repository.name,
      description: repository.description,
      owner: repository.owner?.login,
      ownerAvatar: repository.owner?.avatarUrl,
      ownerUrl: repository.owner?.url,
      topics,
      primaryLanguage: languagesList[0]?.name || "None",
      languagesBreakdown: languagesList,
      license: repository.licenseInfo?.name || "None",
      defaultBranch: repository.defaultBranchRef?.name || "main",
      readmePreview: repository.object?.text || "No README.md found.",
      repositoryUrl: repository.url
    },
    statistics: {
      stars: repository.stargazerCount,
      forks: repository.forkCount,
      watchers: repository.watchers?.totalCount || 0,
      openIssues: repository.openIssues?.totalCount || 0,
      closedIssues: repository.closedIssues?.totalCount || 0,
      openPRs: repository.openPRs?.totalCount || 0,
      closedPRs: repository.closedPRs?.totalCount || 0,
      totalContributors: topContributors.length,
      totalCommits: totalCommitsCount,
      releasesCount: repository.releases?.totalCount || 0,
      tagsCount: repository.refs?.totalCount || 0
    },
    commitAnalytics: {
      totalCommits: totalCommitsCount,
      recentCommits: commitNodes.map(c => ({
        sha: c.oid,
        message: c.messageHeadline,
        date: c.committedDate,
        author: c.author?.user?.login || c.author?.name
      })),
      topContributors
    },
    issueAnalytics: {
      goodFirstIssues,
      bugIssues,
      documentationIssues: docIssues,
      featureRequests: featureIssues,
      enhancementRequests: enhancementIssues,
      assignedIssues,
      unassignedIssues,
      openIssuesList: issueNodes.filter(i => i.state === 'OPEN').map(i => ({
        number: i.number,
        title: i.title,
        state: i.state,
        createdAt: i.createdAt,
        labels: i.labels?.nodes?.map(l => ({ name: l.name, color: l.color })) || []
      }))
    },
    prAnalytics: {
      totalPRs: totalPrs,
      openPRs: openPrs,
      closedPRs: totalPrs - openPrs,
      mergedPRs: mergedPrs,
      rejectedPRs: rejectedPrs,
      recentPRActivity: prNodes.slice(0, 10).map(p => {
        const lastCommit = p.commits?.nodes?.[0]?.commit;
        const statusRollup = lastCommit?.statusCheckRollup;
        
        return {
          number: p.number,
          title: p.title,
          state: p.state,
          createdAt: p.createdAt,
          mergedAt: p.mergedAt,
          author: p.author?.login,
          authorAvatar: p.author?.avatarUrl,
          prUrl: p.url,
          status: statusRollup?.state || "PENDING",
          checks: statusRollup?.contexts?.nodes?.map(c => ({
            name: c.name || c.context,
            status: c.status || c.state,
            conclusion: c.conclusion || c.state,
            url: c.url || c.targetUrl
          })) || []
        };
      })
    },
    recentActivityFeed: [
      ...commitNodes.slice(0, 5).map(c => ({
        type: "commit",
        title: c.messageHeadline,
        actor: c.author?.user?.login || c.author?.name,
        date: c.committedDate
      })),
      ...prNodes.slice(0, 5).map(p => ({
        type: "pull_request",
        title: `PR #${p.number}: ${p.title}`,
        actor: p.author?.login,
        date: p.createdAt,
        state: p.state
      })),
      ...issueNodes.slice(0, 5).map(i => ({
        type: "issue",
        title: `Issue #${i.number}: ${i.title}`,
        date: i.createdAt,
        state: i.state
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
  };
};