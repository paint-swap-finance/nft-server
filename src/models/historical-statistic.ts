import {
  BaseEntity,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ETHEREUM_DEFAULT_TOKEN_ADDRESS } from "../constants";
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

  @Column({ default: "" })
  tokenAddress: string;

  static async getAllStatisticTimeseries(statistic: string): Promise<any[]> {
    //TODO type
    if (statistic !== "dailyVolumeUSD") {
      return [];
    }
    return this.createQueryBuilder("historical-statistic")
      .select(`SUM(historical-statistic.${statistic})`, statistic)
      .addSelect("extract(epoch from timestamp)", "date")
      .groupBy("historical-statistic.timestamp")
      .orderBy({
        "historical-statistic.timestamp": "ASC",
      })
      .getRawMany();
  }

  static async getCollectionsStatisticTimeseries(
    statistic: string,
    slug: string
  ): Promise<any[]> {
    //TODO type
    if (statistic !== "dailyVolume") {
      return [];
    }
    return this.createQueryBuilder("historical-statistic")
      .select(`SUM(historical-statistic.${statistic})`, statistic)
      .addSelect("extract(epoch from timestamp)", "date")
      .groupBy("historical-statistic.timestamp")
      .orderBy({
        "historical-statistic.timestamp": "ASC",
      })
      .innerJoin("historical-statistic.collection", "collection")
      .where("collection.slug = :slug", { slug })
      .getRawMany();
  }

  static async getChainsStatisticTimeseries(
    statistic: string,
    chain: string
  ): Promise<any[]> {
    //TODO type
    if (statistic !== "dailyVolume") {
      return [];
    }
    return this.createQueryBuilder("historical-statistic")
      .select(`SUM(historical-statistic.${statistic})`, statistic)
      .addSelect("extract(epoch from timestamp)", "date")
      .groupBy("historical-statistic.timestamp")
      .orderBy({
        "historical-statistic.timestamp": "ASC",
      })
      .innerJoin("historical-statistic.collection", "collection")
      .where("collection.chain = :chain", { chain })
      .getRawMany();
  }

  static async getIncompleteHistoricalStatistics(): Promise<HistoricalStatistic[]> {
    return this.createQueryBuilder("historical-statistic")
      .select('historical-statistic')
      .where('historical-statistic.dailyVolumeUSD = 0')
      .andWhere('historical-statistic.dailyVolume != 0')
      .getMany()
  }
}
