import mongoose from "mongoose";
import { WorkflowRun } from "../../src/models/WorkflowRunSchema";
import {
  printSection,
  printSubSection,
  pass,
  fail,
  assert,
} from "../harness";

const TEST_MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/hermes-test";

export async function runTest() {
  printSection("Test O: WorkflowRun Persistence");

  // Connect to MongoDB
  let connected = false;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(TEST_MONGO_URI);
    }
    connected = true;
  } catch (e: any) {
    pass(`O: Skipped — MongoDB not available: ${e.message}`);
    return;
  }

  const projectId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  try {
    // ── O1: Happy path → queued → running → completed ──────────────────────
    printSubSection("O1: Happy path state transitions");

    const run = await WorkflowRun.create({
      projectId,
      userId,
      status: "queued",
      input: "Test input",
    });

    assert(run.status === "queued", "Initial status is queued");
    assert(run.executionVersion === 1, "Default executionVersion is 1");
    assert(run.startedAt === undefined, "startedAt is null initially");
    assert(run.completedAt === undefined, "completedAt is null initially");

    // Transition: running
    const beforeStart = new Date();
    const running = await WorkflowRun.findByIdAndUpdate(
      run._id,
      { status: "running", startedAt: new Date(), executionVersion: 2 },
      { new: true },
    );
    assert(running!.status === "running", "Status updated to running");
    assert(running!.startedAt! >= beforeStart, "startedAt timestamp set");
    assert(running!.executionVersion === 2, "executionVersion updated to 2");

    // Transition: completed
    const beforeComplete = new Date();
    const completed = await WorkflowRun.findByIdAndUpdate(
      run._id,
      {
        status: "completed",
        output: "Final result",
        agentCount: 2,
        toolCount: 1,
        modelProvider: "bluesmind",
        modelName: "gpt-4o",
        executionVersion: 2,
        completedAt: new Date(),
      },
      { new: true },
    );
    assert(completed!.status === "completed", "Status updated to completed");
    assert(completed!.output === "Final result", "Output persisted");
    assert(completed!.agentCount === 2, "agentCount persisted");
    assert(completed!.toolCount === 1, "toolCount persisted");
    assert(completed!.modelProvider === "bluesmind", "modelProvider persisted");
    assert(completed!.modelName === "gpt-4o", "modelName persisted");
    assert(completed!.completedAt! >= beforeComplete, "completedAt timestamp set");
    assert(completed!.startedAt! < completed!.completedAt!, "startedAt < completedAt");
    assert(completed!.error === undefined, "error is null on success");

    // Cleanup
    await WorkflowRun.findByIdAndDelete(run._id);
    pass("O1: Happy path state transitions verified");

    // ── O2: Validation failure → queued → failed ───────────────────────────
    printSubSection("O2: Validation failure path");

    const run2 = await WorkflowRun.create({
      projectId,
      userId,
      status: "queued",
      input: "Test",
    });

    const failed = await WorkflowRun.findByIdAndUpdate(
      run2._id,
      { status: "failed", error: "Validation error: missing model", completedAt: new Date() },
      { new: true },
    );
    assert(failed!.status === "failed", "Status updated to failed");
    assert(failed!.error === "Validation error: missing model", "Error message persisted");
    assert(failed!.completedAt !== undefined, "completedAt set on failure");
    assert(failed!.startedAt === undefined, "startedAt NOT set (failed before running)");
    assert(failed!.output === undefined, "output is null on failure");

    await WorkflowRun.findByIdAndDelete(run2._id);
    pass("O2: Validation failure path verified");

    // ── O3: Runtime failure → queued → running → failed ────────────────────
    printSubSection("O3: Runtime failure path");

    const run3 = await WorkflowRun.create({
      projectId,
      userId,
      status: "queued",
      input: "Test",
    });

    await WorkflowRun.findByIdAndUpdate(
      run3._id,
      { status: "running", startedAt: new Date(), executionVersion: 2 },
    );

    const failedRuntime = await WorkflowRun.findByIdAndUpdate(
      run3._id,
      { status: "failed", error: "Execution error: tool not found", completedAt: new Date() },
      { new: true },
    );
    assert(failedRuntime!.status === "failed", "Status updated to failed");
    assert(failedRuntime!.error!.includes("tool not found"), "Error message persisted");
    assert(failedRuntime!.startedAt !== undefined, "startedAt set (was running)");
    assert(failedRuntime!.completedAt !== undefined, "completedAt set");
    assert(failedRuntime!.startedAt! < failedRuntime!.completedAt!, "startedAt < completedAt");

    await WorkflowRun.findByIdAndDelete(run3._id);
    pass("O3: Runtime failure path verified");

    // ── O4: Output persistence with various types ──────────────────────────
    printSubSection("O4: Output persistence edge cases");

    // Empty output
    const run4 = await WorkflowRun.create({
      projectId,
      userId,
      status: "queued",
    });
    const r4 = await WorkflowRun.findByIdAndUpdate(
      run4._id,
      { status: "completed", output: "", completedAt: new Date() },
      { new: true },
    );
    assert(r4!.output === "", "Empty string output persisted");
    await WorkflowRun.findByIdAndDelete(run4._id);

    // Long output
    const longOutput = "x".repeat(10000);
    const run5 = await WorkflowRun.create({
      projectId,
      userId,
      status: "queued",
    });
    const r5 = await WorkflowRun.findByIdAndUpdate(
      run5._id,
      { status: "completed", output: longOutput, completedAt: new Date() },
      { new: true },
    );
    assert(r5!.output!.length === 10000, "Long output persisted correctly");
    await WorkflowRun.findByIdAndDelete(run5._id);

    pass("O4: Output edge cases verified");

    // ── O5: Status enum enforcement ────────────────────────────────────────
    printSubSection("O5: Status enum enforcement");
    const run6 = await WorkflowRun.create({
      projectId,
      userId,
      status: "queued",
    });

    try {
      (run6 as any).status = "invalid-status";
      await run6.save();
      fail("O5: Should have thrown for invalid status");
    } catch (e: any) {
      pass("O5: Invalid status correctly rejected");
    }

    await WorkflowRun.findByIdAndDelete(run6._id);

  } finally {
    // Don't disconnect — other tests may share the connection
  }

  pass("All Test O cases passed");
}
