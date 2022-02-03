To publish a new version of EME logger, you must be a **direct** member of the
`eme-logger-admins` group inside Google.

Releasing on GitHub:

1. Commit all functional changes for the new version.
2. Merge the release PR created by our release workflow.
3. Wait for the release to complete.
4. Download the extension zip file which is attached to the release.

Publishing on the Chrome Web Store:

1. Visit [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Locate `EME Call and Event Logger` in the dashboard.
3. Click `Edit` on that item in the dashboard.
4. Click `Upload Updated Package`.
5. Click `Choose file`.
6. Choose the zip file you downloaded in the previous steps.
7. Click `Upload`.
8. Scroll to the bottom of the edit page and click `Publish changes`.
9. Click `OK` on the confirmation dialog.
10. If you are prompted to pay a one-time fee (which you should expense), sadly,
    it seems that your edits were lost and you must start again at step 2.

