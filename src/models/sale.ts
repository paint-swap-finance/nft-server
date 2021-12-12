import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Collection } from "./collection";
import { Marketplace } from "../types";

@Entity()
export class Sale extends BaseEntity {
  @PrimaryColumn()
  txnHash: string;

  @ManyToOne(() => Collection, (collection) => collection.sales, {
    onDelete: "CASCADE",
  })
  @JoinColumn()
  collection: Collection;

  @Column({ type: "timestamptz" })
  timestamp: Date;

  @Column()
  sellerAddress: string;

  @Column()
  buyerAddress: string;

  @Column()
  marketplace: Marketplace;

  // The price denominated in the paymentTokenAddress token
  @Column({ type: "double precision" })
  price: number;

  // The price denominated in the chain's native token
  @Column({ type: "double precision", default: 0 })
  priceBase: number;

  // The price denominated in USD
  @Column({ type: "double precision", default: 0 })
  priceUSD: number;

  @Column()
  paymentTokenAddress: string;

  @Column({ default: false })
  blacklisted: boolean;

  static async getUnconvertedSales(): Promise<Sale[]> {
    return this.createQueryBuilder("sale")
      .leftJoinAndSelect("sale.collection", "collection")
      .where("sale.price != 0")
      .andWhere("sale.priceBase = 0")
      .limit(500000)
      .getMany();
  }

  static async getPaymentTokenAddresses(
    all = true
  ): Promise<Record<string, string>[]> {
    if (all) {
      return this.createQueryBuilder("sale")
        .select("collection.chain", "chain")
        .addSelect("sale.paymentTokenAddress", "address")
        .distinct(true)
        .leftJoin("sale.collection", "collection")
        .getRawMany();
    }

    return this.createQueryBuilder("sale")
      .select("collection.chain", "chain")
      .addSelect("sale.paymentTokenAddress", "address")
      .distinct(true)
      .leftJoin("sale.collection", "collection")
      .where("sale.price != 0")
      .andWhere("sale.priceBase = 0")
      .andWhere("sale.priceUSD = 0")
      .getRawMany();
  }
}
