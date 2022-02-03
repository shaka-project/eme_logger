To publish a new version of EME logger, you must be a **direct** member of the
`eme-logger-admins` group inside Google.

Releasing on GitHub:

1. Commit all functional changes for the new version.
2. Merge the release PR created by our release workflow.
3. Wait for the release to complete.
4. Download the extension zip file which is attached to the release.

Publishing on the Chrome Web Store:

1. Visit [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Select `EME Logger Admins` from the `Publisher` setting in the top-right.
3. Click `EME Call and Event Logger` in the dashboard.
4. Click `Package` on the left of the dashboard.
5. Click `Upload new package` in the top-right.
6. Click `Browse`.
7. Choose the zip file you downloaded in the previous steps.
8. Click `Submit for review` in the top-right.
9. Make sure `Publish ... automatically` is checked in the confirmation dialog.
10. Click `Submit For Review` in the confirmation dialog.
11. If you are prompted to pay a one-time fee (which you should expense), sadly,
    it seems that your edits were lost and you must start again at step 2.

