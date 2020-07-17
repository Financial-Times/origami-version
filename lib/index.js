'use strict';
const semver = require('semver');

module.exports = {
    highestReleaseTypeFromLabels(labels = []) {
        // Possible release types
        // 'major' | 'premajor' | 'minor' | 'preminor' | 'patch' | 'prepatch' | 'prerelease'
        const major = labels.includes('release:major');
        if (major) {
            return 'major';
        }
        const minor = labels.includes('release:minor');
        if (minor) {
            return 'minor';
        }
        const patch = labels.includes('release:patch');
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
