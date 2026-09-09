# Going live — two steps

Everything is committed on `main` in the bundle (`autofile-concept.bundle`).
The session that built this can read your Vercel account but can't create
projects, and its GitHub token is scoped to other repos — so these two steps
are yours. Both are quick.

## 1. GitHub

```bash
# create the repo — either in the GitHub UI, or:
gh repo create Adonis7575/autofile-concept --public \
  --description "An AI note-taking app that files notes for you, and shows its work."

# then, from wherever you saved autofile-concept.bundle:
git clone autofile-concept.bundle autofile-concept
cd autofile-concept
git remote set-url origin https://github.com/Adonis7575/autofile-concept.git
git push -u origin main
```

The bundle carries the full history — one commit, authored as you.

## 2. Vercel

Dashboard → **Add New → Project → Import** `Adonis7575/autofile-concept`.

Framework preset: **Other**. No build command, no output directory, no env
vars. `vercel.json` already sets `cleanUrls`, which is what makes `/concept`
and `/spec` work without the `.html`.

Or from the CLI in the repo:

```bash
npx vercel --prod
```

## After that

Every push to `main` redeploys. To change the docs, edit the markdown in
`docs/` and run `npm run build:site` before committing — `concept.html` and
`spec.html` are generated, not hand-edited.

If you'd rather I drive Vercel from a session like this one in future, the
connector needs project-creation permission on the `donaghe-enterprise` team;
right now it can read projects and deployments but not create them.
