import { task, types } from "hardhat/config";

import { importDeployment } from "./importDeployment";

export const TASK_ETHERSCAN_IMPORT = 'etherscan-import';

task(TASK_ETHERSCAN_IMPORT, 'import contract artifact from etherscan')
  .addPositionalParam(
    'address',
    'address of the contract to import',
    undefined,
    types.string
  )
  .addOptionalParam('name', 'deployment name (if not specified, the deployed contract name will be used)', undefined, types.string)
  .addOptionalParam('apiKey', 'etherscan api key', undefined, types.string)
  .addOptionalParam(
    'apiUrl',
    'specify the url manually',
    undefined,
    types.string
  )
  .setAction(async (args, hre) => {
    const deploymentsPath = hre.config.paths.deployments;
    const etherscanApiKey =
      args.apiKey ||
      process.env.ETHERSCAN_API_KEY ||
      hre.network.verify?.etherscan?.apiKey ||
      hre.config.verify?.etherscan?.apiKey;
    if (!etherscanApiKey) {
      throw new Error(
        `No Etherscan API KEY provided. Set it through command line option, in hardhat.config.ts, or by setting the "ETHERSCAN_API_KEY" env variable`
      );
    }
    await importDeployment(hre, args.address, {
      contractName: args.name,
      etherscanApiKey,
      apiUrl: args.apiUrl || hre.network.verify?.etherscan?.apiUrl,
      path: deploymentsPath,
    });
  });