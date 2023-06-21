import axios from "axios";
import { ProxyKind } from "./types";

export interface RawContractInfo {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
};

interface ContractSource {
  content: string;
  keccak256?: string;
  license?: string;
};

interface ContractInfo {
  name: string;
  address: string;
  abi: any[];
  proxyKind: ProxyKind;
  implementation?: string;
  sources: { [contractName: string]: ContractSource },
};

const getProxyKind = (contract: RawContractInfo): ProxyKind => {
  if (contract.Proxy === "0") {
    return ProxyKind.None;
  }
  if (contract.ContractName === "OpenZeppelinTransparentProxy" || contract.ContractName === "OptimizedTransparentUpgradeableProxy") {
    return ProxyKind.OpenZeppelinTransparentProxy;
  }
  return ProxyKind.Other; 
}

const parseSourceCode = (name: string, sourceCode: string): { [contractName: string]: ContractSource } => {
  if (sourceCode.startsWith("{{")) {
    const metadata = JSON.parse(sourceCode.slice(1, -1));
    return metadata.sources;
  } else if (sourceCode.startsWith("{")) {
    return JSON.parse(sourceCode);
  } else {
    return {
      [name]: { content: sourceCode },
    };
  }
};

export class Etherscan {
  public requestUrl: string;
  public apiKey: string;

  constructor(host: string, apiKey: string) {
    this.requestUrl = `${host}/api`;
    this.apiKey = apiKey;
  }

  public async getRawContract(address: string): Promise<RawContractInfo> {
    const params = {
      module: 'contract',
      action: 'getsourcecode',
      address,
      apikey: this.apiKey,
    };
    const response = await axios.get(this.requestUrl, { params });
    return (response.data.result[0] as RawContractInfo);
  }

  public async getContract(address: string): Promise<ContractInfo> {
    const contract = await this.getRawContract(address);
    const abi = JSON.parse(contract.ABI);
    const contractName = contract.ContractName;
    return {
      name: contractName,
      address,
      abi,
      proxyKind: getProxyKind(contract),
      implementation: contract.Implementation === "" ? undefined : contract.Implementation,
      sources: parseSourceCode(contract.ContractName, contract.SourceCode),
    };
  };
}