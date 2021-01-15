'use strict';

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
                'origami-version can not determine the correct version to .' +
                'release\nApply only one of the conflicting labels:' +
                `${appliedIncrementLabels}`);
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
    }
};
