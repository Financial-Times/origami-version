'use strict';

const proclaim = require('proclaim');
const { highestReleaseTypeFromLabels, incrementTag } = require('../lib');

describe('highestReleaseTypeFromLabels', function () {
	const majorLabel = 'release:major';
	const minorLabel = 'release:minor';
	const patchLabel = 'release:patch';
	const typeToReleaseLabel = {
		'major': majorLabel,
		'minor': minorLabel,
		'patch': patchLabel
	};

	it('should return the corresponding release type given a single Origami release label', function () {
		for (const { expectedType, releaseLabel } of Object.entries(typeToReleaseLabel)) {
			const actualType = highestReleaseTypeFromLabels([releaseLabel]);
			proclaim.equal(actualType, expectedType);
		}
	});

	it('should return the highest release type given multiple labels', function () {
		const data = [
			{
				labels: ['release:major-test-dummy', minorLabel, majorLabel, patchLabel, 'zzz', 'aaa', '111'],
				expectedType: 'major',
			},
			{
				labels: ['release:lies', patchLabel, 'zzz', minorLabel, 'aaa', '111'],
				expectedType: 'minor',
			},
			{
				labels: ['release:major-test-dummy', 'zzz', 'aaa', '111', patchLabel],
				expectedType: 'patch',
			},
		];
		for (const { labels, expectedType } of data) {
			const actualType = highestReleaseTypeFromLabels(labels);
			proclaim.equal(actualType, expectedType);
		}
	});

	it('should return `null` given no Origami release labels', function () {
		const actualType = highestReleaseTypeFromLabels(['release:major-test-dummy', 'zzz', 'aaa', '111']);
		proclaim.isNull(actualType);
	});

	it('should return `null` given no labels at all', function () {
		const actualType = highestReleaseTypeFromLabels([]);
		proclaim.isNull(actualType);
	});
});

describe('incrementTag', function () {
	it('should increment a valid semver tag by the release type', function () {
		// with a `v`
		proclaim.equal(incrementTag('v1.0.0', 'major'), 'v2.0.0');
		proclaim.equal(incrementTag('v1.0.0', 'minor'), 'v1.1.0');
		proclaim.equal(incrementTag('v1.0.0', 'patch'), 'v1.0.1');

		// without a `v`
		proclaim.equal(incrementTag('1.0.0', 'major'), 'v2.0.0');
		proclaim.equal(incrementTag('1.0.0', 'minor'), 'v1.1.0');
		proclaim.equal(incrementTag('1.0.0', 'patch'), 'v1.0.1');
	});

	it('should increment a valid pre release semver tag by the release type', function () {
		// releasing a major after a major pre-release releases that major
		proclaim.equal(incrementTag('v2.0.0-beta.1', 'major'), 'v2.0.0');
		// releasing a major after a minor/patch pre-release releases the next major
		proclaim.equal(incrementTag('v2.0.1-beta.1', 'major'), 'v3.0.0');
		proclaim.equal(incrementTag('v2.1.0-beta.1', 'major'), 'v3.0.0');
		// releasing a minor after a minor pre-release releases that minor
		proclaim.equal(incrementTag('v2.1.0-beta.1', 'minor'), 'v2.1.0');
		// releasing a minor after a patch/major pre-release releases the next minor
		proclaim.equal(incrementTag('v2.0.1-beta.1', 'minor'), 'v2.1.0');
		// releasing a minor after a major pre-release releases the major
		proclaim.equal(incrementTag('v2.0.0-beta.1', 'minor'), 'v2.0.0');
		// releasing a patch after a minor pre-release releases that minor
		proclaim.equal(incrementTag('v2.1.0-beta.1', 'minor'), 'v2.1.0');
		// releasing a patch after a patch pre-release releases that patch
		proclaim.equal(incrementTag('v2.0.1-beta.1', 'patch'), 'v2.0.1');
		// releasing a patch after a minor pre-release releases the minor
		proclaim.equal(incrementTag('v2.1.0-beta.1', 'patch'), 'v2.1.0');
		// releasing a patch after a major pre-release releases the major
		proclaim.equal(incrementTag('v2.0.0-beta.1', 'patch'), 'v2.0.0');
	});

	it('should increment a valid semver tag with whitespace by the release type', function () {
		proclaim.equal(incrementTag('  v2.0.0 ', 'major'), 'v3.0.0');
		proclaim.equal(incrementTag('  v2.0.0 ', 'minor'), 'v2.1.0');
		proclaim.equal(incrementTag('  v2.0.0 ', 'patch'), 'v2.0.1');
	});

	it('should throw an error for an invalid semver tag', function () {
		proclaim.throws(() => {
			incrementTag('buried1.0.0semver', 'minor');
		});
	});
});
