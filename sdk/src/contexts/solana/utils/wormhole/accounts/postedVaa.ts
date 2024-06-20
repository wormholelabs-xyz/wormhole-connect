import {
  Commitment,
  Connection,
  PublicKey,
  PublicKeyInitData,
} from '@solana/web3.js';
import { deriveAddress, getAccountData } from '../../utils';
import { MessageData } from '../message';
export class PostedMessageData {
  message: MessageData;
  constructor(message: MessageData) {
    this.message = message;
  }
  static deserialize(data: Buffer) {
    return new PostedMessageData(MessageData.deserialize(data.subarray(3)));
  }
}
export function derivePostedVaaKey(
  wormholeProgramId: PublicKeyInitData,
  hash: Buffer,
): PublicKey {
  return deriveAddress([Buffer.from('PostedVAA'), hash], wormholeProgramId);
}
export async function getPostedMessage(
  connection: Connection,
  messageKey: PublicKeyInitData,
  commitment?: Commitment,
): Promise<PostedMessageData> {
  return connection
    .getAccountInfo(new PublicKey(messageKey), commitment)
    .then((info) => PostedMessageData.deserialize(getAccountData(info)));
}
