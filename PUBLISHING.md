To publish a new version of EME logger, you must be a **direct** member of the
`eme-logger-admins` group inside Google.

Preparing a version to publish:

1. Commit all functional changes for the new version.
2. Update the version number in manifest.json.
3. Commit the version number change.
4. Tag the commit with the version number.
5. Push commits and tags to github.
6. Run `npm run build` to generate a zip file for publication.

Publishing a new version:

1. Visit [Chrome Developer Dashboard](https://chrome.google.com/webstore/developer/dashboard)
2. Locate `EME Call and Event Logger` in the dashboard.
3. Click `Edit` on that item in the dashboard.
4. Click `Upload Updated Package`.
5. Click `Choose file`.
6. Choose the zip file you created in the previous steps.
7. Click `Upload`.
8. Scroll to the bottom of the edit page and click `Publish changes`.
9. Click `OK` on the confirmation dialog.
10. If you are prompted to pay a one-time fee (which you should expense), sadly,
    it seems that your edits were lost and you must start again at step 2.

