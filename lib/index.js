'use strict';
const semver = require('semver');

function isTrue(bool) {
    return bool === true;
}

module.exports = {
    releaseTypeFromLabels(labels = []) {
        // Possible release types
        // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
        const major = labels.includes('release:major');
        const minor = labels.includes('release:minor');
        const patch = labels.includes('release:patch');
        const appliedReleaseLabels = [major, minor, patch].filter(isTrue);
        if (appliedReleaseLabels.length > 1) {
            const errorMessage = 'More than one release label was applied, origami-version only works when one release label is applied to avoid behaviour a user may find surprising.';
            throw new Error(errorMessage + '\n' + `The labels which were applied are: ${JSON.stringify(labels, undefined, 1)}`);
        }
        if (major) {
            return 'major';
        }
        if (minor) {
            return 'minor';
        }
        if (patch) {
            return 'patch';
        }
        return null;
    },
    incrementTag(latestTag, releaseType) {
        const latestVersion = semver.clean(latestTag);
        if (!latestVersion) {
            throw new Error(
                `Could not find latest version from tag "${latestTag}".`
            );
        }

        return 'v' + semver.inc(latestVersion, releaseType);
    }
};
