import {
  BaseEntity,
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";

import { Blockchain } from "../types";
import { HistoricalStatistic } from "./historical-statistic";
import { Sale } from "./sale";
import { Statistic } from "./statistic";

@Entity()
@Index("name_index", { synchronize: false })
@Index("symbol_index", { synchronize: false })
export class Collection extends BaseEntity {
  @PrimaryColumn()
  address: string;

  @OneToOne(() => Statistic, (statistic) => statistic.collection, {
    cascade: true,
  })
  statistic: Statistic;

  @OneToMany(
    () => HistoricalStatistic,
    (historicalStatistic) => historicalStatistic.collection
  )
  historicalStatistics: HistoricalStatistic;

  @OneToMany(() => Sale, (sale) => sale.collection)
  sales: Sale;

  @Column()
  chain: Blockchain;

  @Column({ default: "" })
  slug: string;

  @Column({ default: "" })
  name: string;

  @Column({ default: "" })
  symbol: string;

  @Column({ default: "" })
  description: string;

  @Column()
  defaultTokenId: string;

  @Column({ default: "" })
  logo: string;

  @Column({ default: "" })
  website: string;

  @Column({ default: "" })
  discordUrl: string;

  @Column({ default: "" })
  telegramUrl: string;

  @Column({ default: "" })
  twitterUsername: string;

  @Column({ default: "" })
  mediumUsername: string;

  @Column({
    type: "timestamptz",
    default: () => "make_timestamp(1970, 1, 1, 0, 0, 0)",
  })
  lastFetched: Date;

  static async getSorted(
    column: string,
    direction: "ASC" | "DESC",
    page: number,
    limit: number
  ): Promise<Collection[]> {
    return this.createQueryBuilder("collection")
      .innerJoinAndSelect("collection.statistic", "statistic")
      .orderBy({
        [`statistic.${column}`]: direction,
      })
      .limit(limit)
      .offset(page * limit)
      .getMany();
  }

  public async getLastSale(): Promise<Sale | undefined> {
    return Sale.createQueryBuilder("sale")
      .where("sale.collectionAddress = :address", { address: this.address })
      .orderBy({
        "sale.timestamp": "DESC",
      })
      .limit(1)
      .getOne();
  }

  private static async getDuplicates(): Promise<Collection[]> {
    const slugs = (
      await this.createQueryBuilder("collection")
        .select("collection.slug")
        .groupBy("collection.slug")
        .having("COUNT(collection.slug) > 1")
        .getRawMany()
    )
      .map((result) => result.collection_slug)
      .filter((slug) => slug != "");

    if (slugs.length === 0) return [];

    return this.createQueryBuilder("collection")
      .select()
      .where("collection.slug IN (:...slugs)", { slugs })
      .getMany();
  }

  static async removeDuplicates(): Promise<void> {
    const duplicates = await Collection.getDuplicates();
    const shouldDelete: any = {};
    duplicates.forEach((collection) => {
      if (shouldDelete[collection.slug]) {
        console.log(collection.slug);
        collection.remove();
      } else {
        shouldDelete[collection.slug] = true;
      }
    });
  }

  static async search(term: string): Promise<Collection[]> {
    // .where("to_tsvector(collection.name) @@ to_tsquery(:searchTerm)", { searchTerm })
    return this.createQueryBuilder("collection")
      .innerJoinAndSelect("collection.statistic", "statistic")
      .where(
        "lower(collection.name) LIKE :term OR lower(collection.symbol) LIKE :term",
        { term: `%${term}%` }
      )
      .orderBy({
        "statistic.dailyVolume": "DESC",
      })
      .limit(13)
      .getMany();
  }

  static findNotFetchedSince(hours: number): Promise<Collection[]> {
    const interval = `collection.lastFetched <= NOW() - interval '${hours} hours'`;
    return this.createQueryBuilder("collection")
      .leftJoinAndSelect("collection.statistic", "statistic")
      .where(interval)
      .orderBy("statistic.dailyVolume", "DESC", "NULLS LAST")
      .getMany();
  }
}
