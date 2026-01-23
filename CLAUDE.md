# CLAUDE.md

This file contains instructions for Claude Code when working on this project.

## Deployment Workflow

When the user says "deploy" or asks to deploy the application:

1. Merge `main` into `production`:
   ```bash
   git checkout production
   git merge main
   ```

2. Push the changes to trigger the GitHub Actions deployment:
   ```bash
   git push
   ```

3. Switch back to `main` branch:
   ```bash
   git checkout main
   ```

The GitHub Pages deployment is triggered automatically when changes are pushed to the `production` branch.
