# AI Workflow Algorithm: Atomic Operations and State Persistence

## 1. Principle

To ensure stability and recoverability during development, all AI-driven changes must be **atomic** and **self-contained**. After each significant change, the intermediate result must be saved to a temporary file, and the master plan must be updated.

This algorithm is designed to minimize risks associated with interruptions, ensuring that work can be resumed smoothly and efficiently.

## 2. Algorithm Steps

1.  **Detailed Plan:**
    *   Before starting any task, a detailed plan in `.md` format with checkboxes must be created. This serves as the roadmap for the task.

2.  **Create a Backup:**
    *   Before modifying a critical file (e.g., `gameLogicService.ts`), create a backup copy with a `.bak` extension (e.g., `gameLogicService.ts.bak`). This file is the recovery point.

3.  **Atomic Changes:**
    *   Apply changes in small, logical increments. Prefer `apply_diff` for targeted, isolated edits over rewriting entire files with `write_to_file`.

4.  **Intermediate Verification:**
    *   After each successful modification, run `npm run check` to ensure no syntax errors have been introduced.

5.  **Update the Plan:**
    *   After each successful step, update the `.md` plan file by checking off the completed item.

6.  **Final Verification and Cleanup:**
    *   Only after the file modification is complete and all checks (`npm run check` and `npx playwright test`) have passed, delete the `.bak` file.

## 3. Benefits

*   **Recovery After Failure:** If an interruption occurs, the `.bak` file provides the last working version. The `.md` plan will show exactly where the work stopped, allowing for a seamless continuation.
*   **Risk Mitigation:** Working in small increments significantly reduces the probability of introducing critical bugs.
*   **Transparency:** The plan file provides a clear and up-to-date view of the task's progress.