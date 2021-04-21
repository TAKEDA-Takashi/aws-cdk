/**
 * This script verifies the behavior of the `rewriteReadmeImports` method in `ubergen`,
 * which rewrites '@aws-cdk/...' imports to 'aws-cdk-lib' imports in the package READMEs.
 * Any verification based on expected state of the live READMEs is going to be somewhat fragile,
 * but this is the most certain way to be notified if either the tool is broken or the READMEs
 * have been explicitly changed to no longer reference their import statements.
 *
 * The script looks at a few modules with known different import formats and verifies that the
 * expected rewritten import is present in the generated .jsii manifest.
 */

import * as path from 'path';
import * as fs from 'fs-extra';

const jsiiManifestPath = path.resolve(process.cwd(), '.jsii');
if (!fs.existsSync(jsiiManifestPath)) {
  throw new Error(`No .jsii manifest file found at: ${jsiiManifestPath}`);
}

const jsiiManifest = JSON.parse(fs.readFileSync(jsiiManifestPath, { encoding: 'utf-8' }));

// Expected import statements chosen from the individual module READMEs to have a breadth of styles and syntax.
// If this test fails because one of the below import statements is invalid,
// please update to have a new, comparable example.
// This is admittedly a bit fragile; if this test breaks a lot, we should reconsider validation methodology.
// Count of times this test has been broken by README updates so far (please increment as necessary! :D): 0
const EXPECTED_SUBMODULE_IMPORTS = {
  // import * as alexaAsk from '@aws-cdk/alexa-ask'
  'aws-cdk-lib.alexa_ask': "import { alexa_ask as alexaAsk } from 'aws-cdk-lib';",
  // import { GraphqlType } from '@aws-cdk/aws-appsync';
  'aws-cdk-lib.aws_appsync': "import { GraphqlType } from 'aws-cdk-lib/aws-appsync';",
  // import { PhysicalName } from '@aws-cdk/core';
  'aws-cdk-lib.aws_codepipeline_actions': "import { PhysicalName } from 'aws-cdk-lib';",
  // import * as cdk from '@aws-cdk/core';
  'aws-cdk-lib.aws_stepfunctions': "import * as cdk from 'aws-cdk-lib';",
  // import * as kms from "@aws-cdk/aws-kms";
  'aws-cdk-lib.aws_kms': "import { aws_kms as kms } from 'aws-cdk-lib';",
};

Object.entries(EXPECTED_SUBMODULE_IMPORTS).forEach(([submodule, importStatement]) => {
  const submoduleReadme = jsiiManifest.submodules[submodule]?.readme?.markdown;
  if (!submoduleReadme) {
    console.log(Object.keys(jsiiManifest.submodules)); // eslint-disable-line
    console.log(Object.keys(jsiiManifest.submodules[submodule])); // eslint-disable-line
    console.log(Object.keys(jsiiManifest.submodules[submodule]?.readme)); // eslint-disable-line
    throw new Error(`jsii manifest for submodule ${submodule} not found`);
  } else if (!submoduleReadme.includes(importStatement)) {
    const errorMessage = `Expected to find import statement in ${submodule} README: ${importStatement}\n` +
      'This may mean the README has changed and this test needs to be updated, or the uberGen rewriteReadmeImports method is broken.';
    throw new Error(errorMessage);
  }
});
