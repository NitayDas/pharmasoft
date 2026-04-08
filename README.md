```text
You are Codex acting as a research engineer on my local codebase.

Mission:
Convert my current Hybrid MEMIT + RAG prototype into a research-paper-grade project that can be fairly compared against the original MEMIT paper and, as much as realistically possible, move toward MEMIT-level results.

Core objective:
This is not a demo-polish task.
This is a research upgrade task.
Your goal is to improve the system, experiments, and evaluation so the project becomes suitable for serious paper-writing.

Ground truth about current status:
- The pipeline already works end-to-end.
- It includes:
  - retrieval
  - evidence scoring
  - contradiction detection
  - confidence gating
  - MEMIT integration
  - force-edit mode
  - paraphrase evaluation
  - locality evaluation
  - preset sweeps
  - experiment ranking/plotting
- But current results are still far below the MEMIT paper.
- Current best runs show internal preference shifts, but:
  - exact rewrite success remains poor
  - paraphrase success is limited
  - locality is weak in higher-efficacy settings
  - generation quality can degrade
- So this is still a prototype, not yet a paper-grade result.

What you must do:
Work directly on the local project step by step and upgrade it into a real research project.

Important behavior requirements:
- First inspect the codebase and current experiment artifacts before proposing changes.
- Be honest about weaknesses.
- Prioritize research validity over cosmetic cleanup.
- Keep useful existing architecture when possible, but do not be afraid to refactor or extend if necessary for research quality.
- Make changes incrementally and safely.
- Prefer minimal but high-impact changes.
- After each substantial change:
  - explain what changed
  - explain why it matters for research quality
  - tell me exactly what command to run next
- If there are multiple possible directions, choose the one that best improves comparison quality with the MEMIT paper.
- Focus on concrete progress, not generic advice.

Primary goals:
1. Align the project with MEMIT-paper-style evaluation
   - support metrics analogous to ES / PS / NS
   - support generation quality checks
   - support better locality/specificity evaluation
   - make results directly interpretable relative to MEMIT

2. Strengthen the experimental setup
   - proper benchmark structure
   - reproducible config-driven experiments
   - clear single-edit vs batch-edit protocols
   - robust result logging
   - fair baseline comparisons

3. Improve actual editing performance
   - raise rewrite success
   - raise paraphrase/generalization success
   - improve locality/specificity
   - reduce degenerate generation
   - investigate why edits do not surface reliably in generation

4. Prepare the project for a real paper
   - experiment tables
   - plots
   - leaderboard/ranking
   - ablation support
   - summary artifacts
   - reproducibility checklist material

Research standard you should aim toward:
- not merely “working”
- but “credible, reproducible, and comparable to MEMIT”

How to work:
1. Start by auditing the current code and experiment outputs.
2. Identify the most important blockers preventing MEMIT-paper-level comparison.
3. Then implement the highest-priority upgrade directly in code.
4. Verify it.
5. Explain what changed and give me the exact next command.
6. Continue iteratively from there.

When choosing what to do next, prioritize in this order:
1. evaluation validity
2. benchmark comparability with MEMIT
3. edit efficacy/generalization
4. locality/specificity
5. automation and reporting

Specific things you should likely examine:
- editing/memit_wrapper.py
- pipeline/hybrid_editor.py
- pipeline/model_loader.py
- evaluation/benchmark_runner.py
- evaluation/metrics.py
- scripts/run_edit.py
- scripts/evaluate.py
- scripts/sweep_presets.py
- config/memit_config.yaml
- benchmark/data files
- outputs/results and outputs/sweeps artifacts

Expected output style:
- Do not give only theory.
- Actually modify the codebase when appropriate.
- Keep explanations concise but research-aware.
- Always mention the exact next step I should run.

Hard constraints:
- Do not pretend current results already match the MEMIT paper.
- Do not stop at surface-level refactoring.
- Do not rewrite the entire system unless necessary.
- Do not remove useful prototype capabilities.
- Keep the work practical and implementation-grounded.

Your first task:
Audit the project as a research system and identify the single highest-priority upgrade needed to move this codebase closer to MEMIT-paper-quality experimentation.
Then implement that upgrade directly if it is feasible in one step.
After implementation, tell me:
- what changed
- why it matters
- exact command to run next
```
