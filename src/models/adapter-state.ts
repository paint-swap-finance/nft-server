import {
  BaseEntity,
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AdapterType } from "../types";

@Entity()
export class AdapterState extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  name: AdapterType;

  @Column({ default: 0, type: "bigint" })
  lastSyncedBlockNumber: bigint;

  static findByName(name: AdapterType) {
    return this.createQueryBuilder("adapterState")
      .where("adapterState.name = :name", { name })
      .getOne();
    }
}