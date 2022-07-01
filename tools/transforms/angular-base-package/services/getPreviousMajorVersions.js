'use strict';

const child = require('child_process');
const semver = require('semver');
const versionMatcher = /refs\/tags\/(\d+.+)$/mg;

/**
 * 获取之前所有最新的主版本，按语义版本降序排序
 *
 * @param packageInfo 包信息，来源于dgeni-packages/git
 * @param versionInfo 版本信息，来源于dgeni-packages/git
 * @returns {(function(): ([]|*))|*}
 */
module.exports = function getPreviousMajorVersions(packageInfo, versionInfo) {
    return () => {
        // 使用远程tag，因为使用git clone --depth=...进行克隆时，本地仓库可能未包含所有提交
        const repoUrl = packageInfo.repository.url;
        const tagResults = child.spawnSync('git', ['ls-remote', '--tags', repoUrl], {encoding: 'utf8'});
        if (tagResults.status !== 0) {
            return [];
        }

        const majorVersions = {};
        tagResults.stdout.replace(versionMatcher, (_, tag) => {
            const version = semver.parse(tag);

            // 忽略不匹配语义版本格式的tag
            if (version === null) {
                return;
            }

            // 忽略预发版本
            if (version.prerelease !== null && version.prerelease.length > 0) {
                return;
            }

            // 忽略主版本大于等于当前主版本的tag
            if (version.major >= versionInfo.currentVersion.major) {
                return;
            }

            // tag版本大于之前获取的版本时，更新主版本对应的版本
            const currentVersion = majorVersions[version.major];
            if (currentVersion === undefined || semver.compare(version, currentVersion) === 1) {
                majorVersions[version.major] = version;
            }
        });

        // 降序排序
        return semver.sort(Object.values(majorVersions)).reverse();
    };
};
