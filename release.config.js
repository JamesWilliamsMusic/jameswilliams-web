const branch = process.env.GITHUB_REF_NAME || process.env.BRANCH || 'main';

const isMainBranch = branch === 'main';

const config = {
  branches: [
    { name: 'main' },
    {
      name: 'feat/*',
      prerelease: '${name.replace(/\\//g, "-")}',
    },
    {
      name: 'fix/*',
      prerelease: '${name.replace(/\\//g, "-")}',
    },
  ],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};

// Only add changelog and git plugins for main branch releases
if (isMainBranch) {
  config.plugins.splice(2, 0,
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json'],
        message: 'chore(release): v${nextRelease.version} [skip ci]',
      },
    ]
  );
}

module.exports = config;
