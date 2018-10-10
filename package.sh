#!/bin/bash

# Requires "jq" to parse JSON, "zip" to modify the zip file, and "git".

# Fail and exit as soon as a command fails.
set -e

# Get the version from the manifest and construct a filename.
VERSION=$(cat manifest.json | jq -r '.version')
ARCHIVE=eme_logger-$VERSION.zip

# Create an archive using git.  This method ensures that no uncommitted files
# from your working directory are deployed.
git archive HEAD --format=zip > "$ARCHIVE"

# Quietly (-q) remove (-d) certain files from the archive.
zip -q -d "$ARCHIVE" package.sh "spec/*" "third_party/*"

echo "$ARCHIVE created."
