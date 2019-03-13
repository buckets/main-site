import { hashStrings } from 'buckets-core/dist/util'

export class TransactionIDGenerator {
  private hashcount: {[k:string]:number} = {};
  makeID(data:string[]):string {
    let rowhash = hashStrings(data);

    // If there are duplicates based on `data`, they need their own unique hash per instance of TransactionIDGenerator
    if (!this.hashcount[rowhash]) {
      this.hashcount[rowhash] = 0;
    }
    this.hashcount[rowhash] += 1;
    let full_row_hash = hashStrings([
      rowhash,
      this.hashcount[rowhash].toString(),
    ])
    return `buckets-${full_row_hash}`;
  }
}