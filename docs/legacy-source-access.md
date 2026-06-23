# Legacy Source Access

The legacy implementation was removed from active main during I0.5 because it
contained unverified Flask, Render, Google Sheets, email, Git-mutating helper,
Bitcoin-economics, plotting, and model code that did not match the clean
offline-first product skeleton boundary.

The source was not deleted from Git history. It remains preserved at:

- Branch: `legacy/pre-orbital-compute-lab`
- Commit: `c93c7366edcd86b83896c3c39b753805183c3126`

Inspect legacy files read-only with Git. Example:

```powershell
git show legacy/pre-orbital-compute-lab:app.py
```

Do not execute legacy source. It was not verified in I0 or I0.5, was not
approved for reuse, and remains subject to the security, provenance, privacy,
and licensing findings in [audit-report.md](audit-report.md) and
[legacy-inventory.md](legacy-inventory.md).

No history rewrite occurred. The protected branch remains the archive; unsafe
source was not copied into an active `legacy/` directory.
