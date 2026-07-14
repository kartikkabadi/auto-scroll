# Skill: Fix Chrome Web Store review

## When to use
Use this skill when the user has feedback from the Chrome Web Store or a user that requires a code change in the Auto Scroll extension.

## Steps
1. Read the review or issue carefully and identify the exact file/symbol involved.
2. Make the smallest change that addresses the feedback.
3. Run `npm run lint` and `npm run test`.
4. Run `npm run build` and manually verify the extension still loads in `dist/`.
5. Open a pull request with a clear summary of the change and the review it addresses.
