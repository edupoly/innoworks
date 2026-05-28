import { Worker } from "bullmq";
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { getRedisConnection } from '../lib/redis.js';

const connection = getRedisConnection();

export const testWorker = new Worker(
  "test-execution",
  async (job) => {
    const { submissionId } = job.data;
    console.log(`Running tests for submission ${submissionId}...`);

    try {
      const submission = await Submission.findById(submissionId).populate('project');
      if (!submission) throw new Error("Submission not found");

      await Submission.findByIdAndUpdate(submissionId, { status: "TESTING" });

      // Simulate test execution
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const testOutput = "All tests passed! (Simulated)";
      const success = true;

      if (success) {
        await Submission.findByIdAndUpdate(submissionId, {
          status: "APPROVED",
          testOutput,
        });

        // Calculate metrics (simulated logic)
        const project = submission.project;
        const bounty = project.bounty || 100;

        // Update User stats
        await User.findByIdAndUpdate(submission.user, {
          $inc: { 
            xp: bounty,
            consistencyScore: Math.floor(Math.random() * 5) + 1,
            perfectionScore: Math.floor(Math.random() * 5) + 1,
            collaborationScore: Math.floor(Math.random() * 5) + 1,
            communicationScore: Math.floor(Math.random() * 5) + 1,
            adaptabilityScore: Math.floor(Math.random() * 5) + 1,
            innovationScore: Math.floor(Math.random() * 5) + 1,
          }
        });

        // Cap scores at 100
        const user = await User.findById(submission.user);
        const scores = [
          'consistencyScore', 'perfectionScore', 'collaborationScore', 
          'communicationScore', 'adaptabilityScore', 'innovationScore'
        ];
        
        const updates = {};
        scores.forEach(score => {
          if (user[score] > 100) updates[score] = 100;
        });

        if (Object.keys(updates).length > 0) {
          await User.findByIdAndUpdate(submission.user, updates);
        }

      } else {
        await Submission.findByIdAndUpdate(submissionId, {
          status: "REJECTED",
          testOutput: "Tests failed.",
        });
      }

      return { success: true };
    } catch (error) {
      console.error(`Test execution failed for ${submissionId}:`, error);
      await Submission.findByIdAndUpdate(submissionId, { 
        status: "REJECTED", 
        testOutput: `Internal Error: ${error.message}` 
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
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
