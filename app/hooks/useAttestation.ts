import { decodeAbiParameters, encodeAbiParameters, hexToBytes } from 'viem';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { useAccount, useConfig, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';

// https://base.easscan.org/schema/view/0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe
const SCHEMA_UID = "0xf58b8b212ef75ee8cd7e8d803c37c03e0519890502d5e99ee2412aae1456cafe";
const EAS_CONTRACT = "0x4200000000000000000000000000000000000021";

const easABI = [
  {
    name: "attest",
    type: "function",
    stateMutability: "payable",
    inputs: [
      {
        name: "request",
        type: "tuple",
        components: [
          { name: "schema", type: "bytes32" },
          { name: "data", type: "tuple", 
            components: [
              { name: "recipient", type: "address" },
              { name: "expirationTime", type: "uint64" },
              { name: "revocable", type: "bool" },
              { name: "refUID", type: "bytes32" },
              { name: "data", type: "bytes" },
              { name: "value", type: "uint256" }
            ]
          }
        ]
      }
    ],
    outputs: [{ name: "", type: "bytes32" }]
  },
  {
    name: "getAttestation",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "uid", type: "bytes32" }
    ],
    outputs: [{
      name: "",
      type: "tuple",
      components: [
        { name: "uid", type: "bytes32" },
        { name: "schema", type: "bytes32" },
        { name: "time", type: "uint64" },
        { name: "expirationTime", type: "uint64" },
        { name: "revocationTime", type: "uint64" },
        { name: "refUID", type: "bytes32" },
        { name: "recipient", type: "address" },
        { name: "attester", type: "address" },
        { name: "revocable", type: "bool" },
        { name: "data", type: "bytes" }
      ]
    }]
  }    
];

export function useAttestation(uid: string) {
  const { data, status } = useReadContract({
    address: EAS_CONTRACT,
    abi: easABI,
    functionName: 'getAttestation',
    args: [uid],
    chainId: base.id,
  });

  let decodedData = null;
  if (status === 'success' && typeof data === 'object' && data && 'data' in data) {
    decodedData = decodeAbiParameters(
      [{ type: 'string' }],
      hexToBytes(data.data as `0x${string}`)
    )[0];
  }
  
  return {
    data,
    status,
    decodedData,
  };
}


export function useMakeStatement() {
  const { switchChainAsync } = useSwitchChain();
  const { status, data, writeContractAsync } = useWriteContract()
  const { chainId } = useAccount();
  const wagmiConfig = useConfig();

  const makeAttestation = async (statement: string) => {
    if (chainId !== base.id) {
      await switchChainAsync({ chainId: base.id });
    }
  
    const encodedData = encodeAbiParameters(
      [{ type: 'string' }],
      [statement]
    );

    const txHash = await writeContractAsync({
      address: EAS_CONTRACT,
      abi: easABI,
      functionName: 'attest',
      args: [{
        schema: SCHEMA_UID,
        data: {
          recipient: '0x0000000000000000000000000000000000000000',
          expirationTime: 0,
          revocable: false,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: encodedData,
          value: 0
        }
      }]
    });

    const receipt = await waitForTransactionReceipt(wagmiConfig, {
      hash: txHash,
      confirmations: 1,
      chainId: base.id,
    });

    return receipt;
  }

  return {
    makeAttestation,
    data,
    status,
  };
}