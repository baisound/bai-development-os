# BAI Development OS Product Extraction / Repository Rename

## Target layout

```text
/home/baisound/
├── bai-development-os/                 # standalone OS product; history base = former ai-team repo
└── projects/
    └── javascript-roulette/             # consumer/reference project
```

## GitHub repository rename

The history-bearing OS repository currently originates from:

```text
https://github.com/baisound/ai-team.git
```

Rename that GitHub repository to:

```text
bai-development-os
```

After the GitHub rename, update the local remote:

```bash
cd /home/baisound/bai-development-os
git remote set-url origin https://github.com/baisound/bai-development-os.git
git remote -v
```

The `javascript-roulette` GitHub repository keeps its existing name and becomes a consumer/reference project.

## History policy

- Former `ai-team` Git history is retained as the lineage of the standalone OS product.
- JavaScript Roulette TASK-001..003 remain in the Roulette repository.
- OS TASK-004 and its later Context Guard/Lifecycle evidence live in the OS repository.
- The import commit should record the source Roulette commit as provenance; unrelated histories are not rewritten or force-merged.
