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

  @OneToOne(() => Statistic, statistic => statistic.collection, {
    cascade: true,
  })
  statistic: Statistic

  @OneToMany(() => HistoricalStatistic, historicalStatistic => historicalStatistic.collection)
  historicalStatistics: HistoricalStatistic;

  @OneToMany(() => Sale, sale => sale.collection)
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

  @Column({ type: "timestamp", default: () => "make_timestamp(1970, 1, 1, 0, 0, 0)" })
  lastFetched: Date;

  static async getSorted(column: string, direction: "ASC" | "DESC", page: number, limit: number): Promise<Collection[]> {
    return this.createQueryBuilder("collection")
      .innerJoinAndSelect("collection.statistic", "statistic", )
      .orderBy({
        [`statistic.${column}`]: direction,
      })
      .limit(limit)
      .offset(page*limit)
      .getMany();
  }

  static findNotFetched(): Promise<Collection[]> {
    return this.createQueryBuilder("collection")
      .where("collection.lastFetched = make_timestamp(1970, 1, 1, 0, 0, 0)")
      .getMany();
    }
}