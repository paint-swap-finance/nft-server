import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";

import { Collection } from "./collection";

@Entity()
export class HistoricalStatistic extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Collection, collection => collection.historicalStatistics, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn()
  collection: Collection;

  @Column({ type: "timestamptz" })
  timestamp: Date;

  @Column({ type: "double precision" })
  dailyVolume: number;

  @Column({ type: "bigint" })
  dailyVolumeUSD: bigint;

  @Column({ type: "double precision" })
  totalVolume: number;

  @Column({ type: "bigint" })
  totalVolumeUSD: bigint;

  @Column({ type: "double precision" })
  marketCap: number;

  @Column({ type: "bigint" })
  marketCapUSD: bigint;

  @Column({ type: "double precision" })
  floor: number;

  @Column()
  floorUSD: number;

  @Column()
  owners: number;
}