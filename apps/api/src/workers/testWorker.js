import { Worker } from "bullmq";
import { Submission } from '../models/Submission.js';
import { User } from '../models/User.js';
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

        // Calculate metrics based on project difficulty
        const project = submission.project;
        const bounty = project.bounty || 100;
        
        // Define score increments based on difficulty
        const scoreMultiplier = 
          project.difficulty === 'Hard' ? 5 : 
          project.difficulty === 'Medium' ? 3 : 2;

        // Fetch user to update with proper validation (using .save() for pre-save hooks)
        const user = await User.findById(submission.user);
        if (user) {
          user.xp += bounty;
          
          // Increment scores deterministically
          user.consistencyScore += scoreMultiplier;
          user.perfectionScore += scoreMultiplier;
          user.collaborationScore += scoreMultiplier;
          user.communicationScore += scoreMultiplier;
          user.adaptabilityScore += scoreMultiplier;
          user.innovationScore += scoreMultiplier;

          await user.save(); // This triggers the pre-save hook to cap scores at 100
          console.log(`✅ Scores updated for @${user.username}: +${bounty} XP, +${scoreMultiplier} performance points.`);
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
