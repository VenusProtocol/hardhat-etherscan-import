# hardhat-etherscan-import

This Hardhat plugin allows users to import contract deployments from Etherscan. Deployments are compatible with `hardhat-deploy` format. With this plugin, you can fetch contract deployments from any EVM-compatible network with an Etherscan-like block explorer (Ethereum, BSC, Arbitrum, Polygon etc.).

## Installation

Currently the plugin is not published to any package repository. To start using the plugin, download the code from GitHub and run the following commands in **your project directory:**

```bash
yarn add hardhat hardhat-deploy  # if not installed already; these are peer dependencies, so you need to install them separately
yarn add /path/to/hardhat-etherscan-import
```

## Usage

To activate the plugin, add the following import to your `hardhat.config.ts`:

```ts
import "hardhat-etherscan-import";
```

Then run the import command from the command line:

```bash
npx hardhat etherscan-import 0xContractAddress --name Comptroller --network bscmainnet
```

Make sure you have networks configured in your hardhat config.

The plugin will create deployments in the configured deployments folder (`deployments/{networkName}` by default).

If the contract is a proxy (verified on Etherscan as a proxy), the plugin will create three deployment files:

* `{contractName}_Proxy.json` – proxy address, proxy ABI
* `{contractName}_Implementation.json` – implementation address, implementation ABI
* `{contractName}.json` – proxy address, merged implementation & proxy ABI (or only implementation ABI for transparent proxies)
