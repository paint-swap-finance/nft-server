import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Collection } from "./collection";

@Entity()
// One entry per collection per day
@Index(["collection", "timestamp"], { unique: true })
export class HistoricalStatistic extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => Collection,
    (collection) => collection.historicalStatistics,
    {
      nullable: false,
      onDelete: "CASCADE",
    }
  )
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

  static async getStatisticTimeseries(
    statistic: string,
    slug: string
  ): Promise<any[]> {
    if (!["dailyVolume", "floor"].includes(statistic)) {
      return [];
    }
    let query = this.createQueryBuilder("historical-statistic")
      .select(`SUM(historical-statistic.${statistic})`, statistic)
      .addSelect("extract(epoch from timestamp)", "date")
      .groupBy("historical-statistic.timestamp")
      .orderBy({
        "historical-statistic.timestamp": "ASC",
      });
    if (slug !== "all") {
      query = query
        .innerJoin("historical-statistic.collection", "collection")
        .where("collection.slug = :slug", { slug });
    }
    return query.getRawMany();
  }
}
