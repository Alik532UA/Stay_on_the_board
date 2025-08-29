# Git Guidelines

This document provides guidelines and tips for working with Git in this project.

## Analyzing Code History (`git blame`)

Our project sometimes undergoes large-scale refactoring (e.g., renaming files, changing indentation, or restructuring code). While these changes improve the codebase, they can add "noise" to the output of `git blame`, making it difficult to see who originally wrote the logic.

To solve this, we use the `.git-blame-ignore-revs` file to tell Git to ignore specific commits that only contain stylistic or structural changes.

### How to Use It

For this feature to work, you need to configure your local Git repository one time:

```bash
git config blame.ignoreRevsFile .git-blame-ignore-revs
```

After running this command, `git blame` (and the blame view in your IDE, like VS Code's "GitLens" extension) will ignore the commits listed in the file, giving you a much cleaner and more useful history.

### Alternative `blame` Command

If you prefer not to change your local Git config, you can use the following command to get a better `blame` output on a case-by-case basis:

```bash
git blame -w -C -C <file_path>
```

What these flags do:
- `-w`: Ignores whitespace changes.
- `-C`: Finds the original author if code was copied or moved *within the same file*. Using it twice (`-C -C`) makes the search more exhaustive and can track code moved from *other files* in the same commit.

We recommend setting up the `ignoreRevsFile` for the best experience.
