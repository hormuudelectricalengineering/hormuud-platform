# Project Instructions

## Planning & Execution Rules

1. **Plan before executing.**
   - For any non-trivial task (3+ steps, edits across multiple files, or unclear scope), create a todo list **first**.
   - Mark tasks as `in_progress` before starting them and `completed` immediately after finishing.
   - Never batch multiple todo completions; update status in real time.

2. **Read before editing.**
   - You must read a file's contents before modifying it. Never edit blindly.
   - Understand surrounding code, imports, and conventions before making changes.

3. **Search before loading.**
   - Use `grep`, `find`, and `exec` to locate relevant code. Do not dump entire files or large codebases into context unless necessary.
   - Prefer targeted reads of specific functions or sections.

4. **Verify after changing.**
   - After any code edit, run the relevant verification command (tests, lint, typecheck, build).
   - If there is no obvious command, ask the user.
   - Do not consider a task complete while tests are failing or the build is broken.

5. **Test-first when possible.**
   - If the project has tests, write or update a failing test that demonstrates the bug or desired behavior **before** fixing/implementing.
   - Then make it pass.

6. **No secrets in code.**
   - Never hardcode API keys, tokens, or passwords into source files.
   - Use environment variables or secure vaults. Never commit `.env` files containing secrets.

7. **Iterative development.**
   - Make small, focused changes. Verify each step before proceeding to the next.
   - If you make a mistake, correct it immediately and note the lesson.

8. **Documentation discipline.**
   - If you discover useful project-specific info (build commands, test commands, architecture notes), append it to this `CLAUDE.md` or `AGENTS.md` if it exists.
   - Keep project knowledge persistent for future sessions.

## Communication Style

- Be concise and direct. Briefly explain what you are doing and why when running commands.
- Do not use emojis unless explicitly requested.
- Do not give time estimates; instead, say you will complete the task as soon as possible.
