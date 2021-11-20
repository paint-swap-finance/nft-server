import { ethers } from "ethers";
import { ETHEREUM_RPC } from "../../env";

export class ERC721 {
  private static provider = new ethers.providers.JsonRpcProvider(ETHEREUM_RPC);

  public static async getFirstTokenId(address: string) {
    const contract = new ethers.Contract(
      address,
      ["function tokenByIndex(uint256) external view returns (uint256)"],
      ERC721.provider
    );
    return await contract.tokenByIndex(0);
  }
}
