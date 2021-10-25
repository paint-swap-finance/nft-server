import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from "typeorm";

import { Collection } from "./collection";

@Entity()
export class Statistic extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Collection, collection => collection.statistic, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn()
  collection: Collection;

  @Column({ type: "double precision" })
  dailyVolume: number;

  @Column({ type: "bigint" })
  @Index()
  dailyVolumeUSD: bigint;

  @Column({ type: "double precision" })
  totalVolume: number;

  @Column({ type: "bigint" })
  @Index()
  totalVolumeUSD: bigint;

  @Column({ type: "double precision" })
  marketCap: number;

  @Column({ type: "bigint" })
  @Index()
  marketCapUSD: bigint;

  @Column({ type: "double precision" })
  floor: number;

  @Column()
  @Index()
  floorUSD: number;

  @Column()
  @Index()
  owners: number;
}