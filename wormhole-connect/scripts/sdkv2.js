const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORK_ROOT = process.env['WORK_ROOT'];
if (!WORK_ROOT) {
  console.error(
    'Please export a WORK_ROOT env var containing the absolute path to a directory containing the following repos:\n- wormhole-sdk-ts\n- example-native-token-transfers',
  );
  process.exit(1);
}

const sdkPath = path.join(WORK_ROOT, 'wormhole-sdk-ts');
const sdkPackageJsonPath = path.join(sdkPath, './package.json');

const { version, workspaces } = JSON.parse(
  fs.readFileSync(sdkPackageJsonPath, 'utf8'),
);

// prepare packages
execSync(`npm pack --workspaces`, { cwd: sdkPath });

// get list of packages
let sdkPackages = {};
for (const workspace of workspaces) {
  if (workspace.includes('examples')) continue;

  const workspacePackageJson = path.join(sdkPath, workspace, 'package.json');

  const { name } = JSON.parse(fs.readFileSync(workspacePackageJson));
  const tgz = name.replace('@', '').replace('/', '-') + '-' + version + '.tgz';

  sdkPackages[name] = path.join(sdkPath, tgz);
}

// install packages
execSync(`npm install ${Object.values(sdkPackages).join(' ')}`);
