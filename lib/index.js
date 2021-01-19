'use strict';
const semver = require('semver');

module.exports = {
    releaseTypeFromLabels(labels = []) {
        const majorLabel = 'release:major';
        const minorLabel = 'release:minor';
        const patchLabel = 'release:patch';
        const betaLabel = 'release:beta';

        // Check there are no conflicting labels. Major/Minor/Patch can not be
        // used together but can be used with a Beta label.
        const incrementLabels = [majorLabel, minorLabel, patchLabel];
        const appliedIncrementLabels = labels.filter(
            label => incrementLabels.includes(label)
        );
        if (appliedIncrementLabels.length > 1) {
            throw new Error('Conflicting release labels were applied, ' +
                'origami-version can not determine the correct version to ' +
                'release. Apply only one of: "' +
                `${appliedIncrementLabels.join('", "')}".`);
        }

        const major = labels.includes(majorLabel);
        const minor = labels.includes(minorLabel);
        const patch = labels.includes(patchLabel);
        const beta = labels.includes(betaLabel);

        if (major) {
            return `${beta ? 'pre' : ''}major`;
        }
        if (minor) {
            return `${beta ? 'pre' : ''}minor`;
        }
        if (patch) {
            return `${beta ? 'pre' : ''}patch`;
        }
        if (beta) {
            return 'prerelease';
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

        // If there's already a beta ignore new pre-releases and increment the
        // current beta instead. This is to defend against users accidentally
        // releasing a beta for a future version which is not being worked on.
        // E.g. Given a PR based on a current beta `v2.0.0-beta.0`, the release
        // tags 'release:major' and 'release:beta' will release `v2.0.0-beta.1`,
        // not `v3.0.0-beta.0`.
        const latestIsPreRelease = semver.prerelease(latestVersion);
        const newPreRelease = [
            'premajor',
            'preminor',
            'prepatch'
        ].includes(releaseType);
        if (latestIsPreRelease && newPreRelease) {
            return 'v' + semver.inc(latestVersion, 'prerelease', 'beta');
        }

        // The 'beta' identifier is only used for pre-releases.
        return 'v' + semver.inc(latestVersion, releaseType, 'beta');
    }
};
