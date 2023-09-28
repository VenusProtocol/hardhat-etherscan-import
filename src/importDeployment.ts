import { HardhatRuntimeEnvironment } from "hardhat/types";
import "hardhat-deploy";

import { Etherscan } from "./Etherscan";
import { DEFAULT_BLOCK_EXPLORER_URLS } from "./constants";
import { ProxyKind } from "./types";

interface ImportDeploymentOptions {
  etherscanApiKey: string;
  contractName?: string;
  apiUrl?: string;
  path?: string;
};

const getBlockExplorerUrl = async (hre: HardhatRuntimeEnvironment): Promise<string> => {
  const chainId = await hre.getChainId();
  const apiUrl = DEFAULT_BLOCK_EXPLORER_URLS[chainId];
  if (!apiUrl) {
    throw new Error(`Network with chainId: ${chainId} not supported. You can specify the url manually via --api-url <url>.`);
  }
  return apiUrl;
}

export const importDeployment = async (hre: HardhatRuntimeEnvironment, address: string, options: ImportDeploymentOptions) => {
  const { deployments } = hre;
  const apiUrl = options.apiUrl || await getBlockExplorerUrl(hre);
  const etherscan = new Etherscan(apiUrl, options.etherscanApiKey);
  const { contractName: userSpecifiedName } = options;
  const contractInfo = await etherscan.getContract(address);
  const nameOnEtherscan = contractInfo.name;
  const contractName = userSpecifiedName || nameOnEtherscan;

  if (contractInfo.proxyKind === ProxyKind.None) {
    await deployments.save(contractName, {
      address: contractInfo.address,
      abi: contractInfo.abi,
    });
  } else {
    const proxy = contractInfo;
    if (!proxy.implementation) {
      throw new Error(`Unexpected proxy without implementation: ${proxy.address}`);
    }
    await deployments.save(`${contractName}_Proxy`, {
      address: proxy.address,
      abi: proxy.abi,
    });

    const implementation = await etherscan.getContract(proxy.implementation);
    await deployments.save(`${contractName}_Implementation`, {
      address: implementation.address,
      abi: implementation.abi,
    });

    let mergedAbi = implementation.abi;
    // If this is a transparent proxy, we don't need to merge the ABI
    if (contractInfo.proxyKind !== ProxyKind.OpenZeppelinTransparentProxy) {
      // Here we assume that there's no shadowing
      mergedAbi = proxy.abi.concat(implementation.abi);
    }
    await deployments.save(contractName, {
      address: proxy.address,
      abi: mergedAbi,
      implementation: implementation.address,
    });
  }
};
