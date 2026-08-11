# Codex tool output compression integration

Research date: 2026-08-11

## Decision

For the first Codex integration, use an **opt-in local `PreToolUse` command hook that rewrites only allowlisted, non-interactive `Bash`/unified-exec calls to a fail-open local runner**. The runner executes the original command, retains its exit status, captures its text output, invokes the deterministic Terse compressor, and emits the raw output whenever compression is skipped or fails.

Do not use `PostToolUse` result replacement as the default path in phase one. It is a real, documented capability and is useful for later experiments, but the current transform contract is text feedback rather than a typed replacement: `updatedMCPToolOutput` is explicitly unsupported, and Codex preserves the original typed result for nested code-mode calls. For shell tools, the post-hook also receives already-truncated output without the command exit code, so a replacement cannot preserve the complete original model-facing contract.

The existing `terse-core` Codex adapter is a useful prototype, not an implementation to copy unchanged. Its hook response uses an obsolete `decision: "Modify"` shape, and `($COMMAND) 2>&1 | node ...` makes the compressor the pipeline endpoint, merges stdout/stderr, can lose the original exit status, and cannot recover raw output if the compressor fails.

## Evidence

### Current supported hook contract

The fresh Codex manual documents `PreToolUse` and `PostToolUse` for shell commands, unified exec, `apply_patch`, MCP tools, and most other local function tools. Hosted tools such as web search are not covered, and specialized paths may opt out. `PreToolUse` can rewrite supported inputs through `permissionDecision: "allow"` plus `updatedInput`. `PostToolUse` receives `tool_response`, can substitute feedback with `continue: false`, but cannot currently use `updatedMCPToolOutput` or `suppressOutput` ([Hooks manual](https://learn.chatgpt.com/docs/hooks)).

The official source confirms the runtime behavior at commit [`3d4d253`](https://github.com/openai/codex/commit/3d4d253f8f4a812c595cd59e2c114c2c3696c293):

- A `PostToolUse` request includes `tool_name`, `tool_input`, and `tool_response` ([request type](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/hooks/src/events/post_tool_use.rs#L24-L45)).
- A failed/invalid hook contributes no feedback; when no replacement is present, normal processing retains the original result ([hook aggregation](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/hooks/src/events/post_tool_use.rs#L73-L137), [result dispatch](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/core/src/tools/registry.rs#L721-L750)).
- `continue: false` turns `reason` into model feedback ([parser/execution](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/hooks/src/events/post_tool_use.rs#L175-L230)); Codex wraps that feedback as a text output while retaining the original only for logging/code-mode behavior ([feedback wrapper](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/core/src/tools/registry.rs#L208-L228)).
- `updatedMCPToolOutput` and `suppressOutput` are rejected as unsupported ([output parser](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/hooks/src/engine/output_parser.rs#L380-L425)).
- Unified exec internally retains raw bytes, exit code, and truncation metadata, but exposes only already-truncated command output to `PostToolUse` ([exec output contract](https://github.com/openai/codex/blob/3d4d253f8f4a812c595cd59e2c114c2c3696c293/codex-rs/core/src/tools/context.rs#L313-L371)).

The locally installed Codex CLI reports `codex-cli 0.147.0-alpha.6.5`; `codex features list` reports both `hooks` and `unified_exec` as stable. This verifies that the researched hook path exists in the current development environment, not only on the documentation site.

### Terse behavior and current adapter

The recovered Terse compressor is deterministic, passes through small outputs, and emits compressed output only above a 20% estimated savings threshold. It has specialized git/test/build compression and a generic lossy path ([compressor source](https://github.com/QT-7274/terse-core/blob/e43daccd8e32b57ed5b0d0535c92900b8c51c059/src/terse-compress.js#L1-L87)). The current Codex adapter selects command patterns, then rewrites the command to a shell pipeline using an older hook response shape ([adapter source](https://github.com/QT-7274/terse-core/blob/e43daccd8e32b57ed5b0d0535c92900b8c51c059/src/hooks/terse-hook-codex.sh#L1-L140)).

The compressor's determinism and passthrough threshold are suitable for the runner. Its current generic truncation and structured reducers still require behavioral fixtures before they can be claimed to preserve all task-relevant semantics.

## Options compared

| Path | Viability | Coverage | Rollback / fail-open | Main risk |
| --- | --- | --- | --- | --- |
| `PreToolUse` rewrite to local runner | **Recommended for phase one** | Allowlisted shell/unified-exec calls | Remove/disable hook; missing hook/runner leaves input unchanged; runner must emit captured raw output on compressor failure | Wrapping changes process/streaming behavior unless scope is narrow |
| `PostToolUse` feedback replacement | Viable experiment | Shell, MCP, `apply_patch`, most local tools; not hosted tools | Hook failure/no output keeps raw result | Replacement is text feedback, typed MCP replacement unsupported, shell post-input lacks exit status, code mode retains original typed result |
| Skill or `AGENTS.md` instruction | Supporting layer only | Calls where the model remembers to use a wrapper | Delete/disable skill; wrapper can fail open | Probabilistic activation and incomplete coverage; no interception API ([skills manual](https://learn.chatgpt.com/docs/build-skills)) |
| User-invoked shell wrapper | Viable fallback | Commands explicitly routed through it | Stop invoking/uninstall wrapper | Not transparent; agent may bypass it |
| MCP server owning/proxying tools | Viable only for owned tools | That MCP server's tools | Disable server/tool in `config.toml` | Cannot transform built-in shell or unrelated MCP outputs; proxy increases integration surface ([MCP manual](https://learn.chatgpt.com/docs/extend/mcp)) |
| App Server dynamic tools | Viable for a custom client, experimental | Client-defined dynamic tools | Remove tool/client | Requires custom Codex client; does not intercept built-ins; API is experimental ([App Server manual](https://learn.chatgpt.com/docs/codex-app-server#dynamic-tool-calls-experimental)) |
| Codex SDK / event consumer | Observability/orchestration, not interception | Thread/item events exposed by SDK/App Server | Stop custom client | Completed-item streams are downstream of execution; documented SDK has no generic built-in result rewrite callback ([SDK manual](https://learn.chatgpt.com/docs/codex-sdk)) |
| Codex CLI source fork | Technically complete | Any output path modified in the fork | Reinstall upstream binary | Highest maintenance/distribution risk; not a supported extension surface |
| Private transcript/event mutation | Reject | Undefined | Undefined | Transcript format is explicitly unstable; no supported mutation contract |

The current session also exposes an executor/composition tool that can call nested tools and choose what text is emitted back to the model. This can reduce output for calls deliberately routed through it, but it is host-specific orchestration, not a portable Codex extension or a transparent interception mechanism.

## Phase-one contract

### Installation and ownership

- Package the adapter as a local Codex plugin or an explicitly managed user hook. Plugin packaging is preferable once distribution matters because hooks and scripts can be versioned together; plugin hooks still require explicit user review/trust ([plugin hook documentation](https://developers.openai.com/plugins/build/plugins#bundled-mcp-servers-and-lifecycle-hooks)).
- Keep all compression local. The hook and runner must not make network calls or persist raw command output.
- The QQ pet app owns enable/disable/uninstall state and aggregate numeric events; the hook owns interception; the runner owns command execution and fail-open output selection; the compressor remains a deterministic pure transform.
- Do not silently edit user configuration. Enablement must be explicit, show the exact hook entry, and retain enough metadata to remove only the entry installed by this product.

### Initial coverage

- Match canonical `Bash`, which also covers unified exec according to the manual.
- Start with a small allowlist of bounded, non-interactive, text-producing commands whose output already has Terse-specific reducers: `git status`, `git diff`, `git log`, selected test runners, and selected build/lint commands.
- Treat test/build commands as a later allowlist tier: package scripts can perform arbitrary writes even when their names look harmless. The initial tier should contain read-only git/listing commands that do not require escalation.
- Skip background/long-running commands, PTYs, commands requiring stdin, heredocs, shell state mutations, secrets/environment dumps, binary/multimodal output, `apply_patch`, arbitrary file reads, and all MCP/hosted tools in phase one.
- Do not use a generic “any long pipeline” rule until semantics and process behavior are tested.

### Fail-open and semantic preservation

- If the hook cannot parse input, cannot locate the runner, or does not recognize a safe command, exit successfully with no control output so Codex runs the original command unchanged.
- Pass the original command to the runner without evaluating generated shell fragments. The invocation must remain human-auditable in approval/logging surfaces; an opaque encoding that hides the original command is not acceptable unless Codex separately shows the decoded command before approval.
- The runner must capture the original combined text output under a strict byte/time cap, retain the original process exit status, and emit raw captured output if the compressor crashes, times out, returns invalid data, exceeds limits, or does not clear the savings threshold.
- The runner must exit with the original command's status after either raw or compressed emission.
- Compression fixtures must assert preservation of failures, final test/build summaries, file paths, line references, git hashes, and truncation markers. Unknown formats pass through unchanged. Determinism alone is not proof of semantic preservation.
- Record only event type, byte/token estimates, savings, duration, compressor version, and applied/bypassed/fallback reason. Never retain the full command output. Treat command text itself as sensitive and either omit it or reduce it to an allowlisted command family.

### Acceptance checks before enabling by default

1. Current documented hook schema passes against the installed Codex version.
2. Original exit status is identical for success, failure, signal termination, and timeout cases.
3. Compressor crash/missing executable/invalid output returns the exact captured raw output.
4. Small and unknown outputs are byte-identical passthroughs.
5. Allowlisted git/test/build fixtures retain all defined semantic invariants.
6. Interactive, background, streaming, secret-bearing, structured, and unsupported tools bypass compression.
7. Disable and uninstall restore the previous Codex config without touching unrelated hooks.
8. Aggregate pet-growth events contain no raw tool content.
9. Hook rewriting does not downgrade, bypass, or obscure Codex approval and sandbox decisions; commands outside the read-only allowlist remain byte-for-byte unchanged.

## Explicit answers to the decision criteria

- **Local-only:** yes for the recommended runner; no network dependency is needed.
- **Opt-in:** yes; Codex additionally requires non-managed hooks to be reviewed and trusted.
- **Uninstall/rollback:** straightforward if configuration ownership is recorded and removal is surgical.
- **Fail-open raw fallback:** achievable for pre-execution wrapping only if the runner captures raw output and owns compressor fallback; the current pipeline adapter does not meet this contract.
- **Semantic preservation:** achievable only as a tested, allowlisted contract. It is not established for arbitrary outputs or the current generic compressor.
- **Coverage:** phase one intentionally covers a subset of shell/unified-exec output. No documented public path transparently transforms every Codex tool result.
- **Maintenance risk:** low-to-medium for documented hooks, medium for plugin packaging/custom runner, high for App Server experimental dynamic tools or an upstream fork.

## Bounded uncertainties

- The docs do not promise that every specialized local tool will remain on the default hook path; coverage must be verified per supported Codex version.
- The official docs do not define a typed general-purpose post-result transform API or a roadmap for `updatedMCPToolOutput`; do not plan against its future availability.
- Capturing command output changes streaming behavior. The phase-one allowlist avoids commands where live output is part of correctness, but the product must decide the exact command families and caps.
- Input rewriting changes the command Codex later classifies and executes. The public contract does not guarantee that an arbitrary wrapper preserves the original command's approval classification, so this must be verified and the wrapper must not hide the original operation.
- Plugin installation/distribution UX may vary by Codex surface and workspace policy. The core hook behavior is shared, but release packaging needs its own implementation decision.

## Newly specifiable decision

Create a follow-up decision ticket: **Define phase-one Codex compression coverage and semantic-preservation contract**. It should choose the exact command allowlist, capture byte/time caps, required preserved fields per reducer, and whether the first implementation is a user hook or packaged plugin. This is now precise because the supported interception boundaries are known.
