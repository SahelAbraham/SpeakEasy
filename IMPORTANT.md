# ⚠️ TO AVOID CONFLICTS IN BRANCHES

Before adding anything new to your branch, always sync it 
with main first to get everyone's latest code.

Run these two commands in your terminal:

    git checkout <your-branch-name>
    git pull origin main

Replace <your-branch-name> with your actual branch e.g:
    git checkout rabiah
    git pull origin main

Do this EVERY TIME before starting new work on your branch.
This prevents merge conflicts when teammates have pushed 
their own code into main.

─────────────────────────────────────────
Our flow:
Work on branch → push → open Pull Request → merge yourself
─────────────────────────────────────────

If you wish to change something in your code after merging, just fix it in your 
branch and open a new PR — GitHub will overwrite the old 
file in main with your updated version automatically.