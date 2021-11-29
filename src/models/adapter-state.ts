import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AdapterType, Blockchain } from "../types";

@Entity()
export class AdapterState extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: AdapterType;

  @Column({ default: Blockchain.Ethereum })
  chain: Blockchain;

  @Column({ default: 0, type: "bigint" })
  lastSyncedBlockNumber: bigint;

  static findByNameAndChain(name: AdapterType, chain: Blockchain) {
    return this.createQueryBuilder("adapterState")
      .where("adapterState.name = :name", { name })
      .andWhere("adapterState.chain = :chain", { chain })
      .getOne();
  }
}
