# eslint-json-to-md

> This package converts the JSON result generated by `eslint` to a nice Markdown file to use with the new GitHub Actions [Job summaries](https://github.blog/2022-05-09-supercharging-github-actions-with-job-summaries/) feature.
> When run inside a workflow, this command dectects the current repository and commit sha to generate the link to the file and line that contain liniting issues.

### Example workflow:

```yml
name: Linting

on:
  pull_request:
    branches:
      - develop

jobs:
  eslint:
    name: eslint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: npm install
        run: npm install
      - name: Generate linting report
        run: npm run lint:js -- --output-file eslint-report.json --format json
        continue-on-error: true
      - name: Annotate code linting results
        uses: ataylorme/eslint-annotate-action@1.2.0
        with:
          repo-token: '${{ secrets.GITHUB_TOKEN }}'
          report-json: 'eslint-report.json'
      - name: Update summary
        run: |
          npm_config_yes=true npx github:10up/eslint-json-to-md --path ./eslint-report.json --output ./eslint-report.md
          cat eslint-report.md >> $GITHUB_STEP_SUMMARY
        if: ${{ failure() }}
```
