import { Worker } from "bullmq";
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { getRedisConnection } from '../lib/redis.js';
import { awardXP } from '../lib/gamification.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

const execAsync = util.promisify(exec);
const connection = getRedisConnection();

export const testWorker = new Worker(
  "test-execution",
  async (job) => {
    const { submissionId } = job.data;
    console.log(`Running tests for submission ${submissionId}...`);

    let tempDir = null;
    try {
      const submission = await Submission.findById(submissionId).populate('project');
      if (!submission) throw new Error("Submission not found");

      await Submission.findByIdAndUpdate(submissionId, { status: "TESTING" });

      const forkUrl = submission.forkUrl;
      const branchName = submission.branchName;
      
      tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'innoworks-test-'));
      
      console.log(`Cloning ${forkUrl} branch ${branchName} into ${tempDir}`);
      
      let testOutput = "";
      let success = false;
      
      try {
        await execAsync(`git clone --depth 1 -b ${branchName} ${forkUrl} .`, { cwd: tempDir, timeout: 30000 });
        testOutput += "Clone successful.\n";
        
        // Check if package.json exists
        const files = await fs.readdir(tempDir);
        if (files.includes('package.json')) {
          testOutput += "Executing tests in isolated Docker sandbox...\n";
          
          // Use Docker to sandbox the execution. Mount tempDir to /app and run npm install & test.
          // --network none prevents malicious network access during tests (if acceptable).
          // For now, we'll allow network for npm install.
          const dockerCommand = `docker run --rm -v "${tempDir}:/app" -w /app node:18-alpine sh -c "npm install && npm test"`;
          
          const { stdout, stderr } = await execAsync(dockerCommand, { timeout: 120000 }); // 2 min timeout for docker
          testOutput += stdout + "\n" + stderr;
          success = true;
        } else {
          testOutput += "No package.json found. Assuming success for non-Node.js project.\n";
          success = true;
        }
      } catch (err) {
        success = false;
        testOutput += "\nError: " + err.message + "\n" + (err.stdout || "") + "\n" + (err.stderr || "");
      }

      if (success) {
        await Submission.findByIdAndUpdate(submissionId, {
          status: "APPROVED",
          testOutput,
        });

        // Calculate metrics based on project difficulty
        const project = submission.project;
        const bounty = project.bounty || 100;
        
        // Define score increments based on difficulty
        const scoreMultiplier = 
          project.difficulty === 'Hard' ? 5 : 
          project.difficulty === 'Medium' ? 3 : 2;

        // Use centralized gamification logic
        await awardXP(submission.user, bounty, 'PR_MERGED');
        
        // We still add the performance points manually as awardXP handles the base XP and broadcast
        const user = await User.findById(submission.user);
        if (user) {
           user.consistencyScore += scoreMultiplier;
           user.perfectionScore += scoreMultiplier;
           user.collaborationScore += scoreMultiplier;
           user.communicationScore += scoreMultiplier;
           user.adaptabilityScore += scoreMultiplier;
           user.innovationScore += scoreMultiplier;
           await user.save();
        }

      } else {
        await Submission.findByIdAndUpdate(submissionId, {
          status: "REJECTED",
          testOutput: testOutput || "Tests failed.",
        });
      }

      return { success };
    } catch (error) {
      console.error(`Test execution failed for ${submissionId}:`, error);
      await Submission.findByIdAndUpdate(submissionId, { 
        status: "REJECTED", 
        testOutput: `Internal Error: ${error.message}` 
      });
      throw error;
    } finally {
      if (tempDir) {
        try {
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (cleanupErr) {
          console.error(`Failed to cleanup temp dir ${tempDir}:`, cleanupErr);
        }
      }
    }
  },
  {
    connection,
    concurrency: 2, // Reduced concurrency to avoid overloading system with git/npm
  },
);

testWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed!`);
});

testWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});

testWorker.on("error", (err) => {
  if (err.code !== 'ECONNREFUSED') {
    console.error("❌ Redis Worker Error:", err.message);
  }
});
