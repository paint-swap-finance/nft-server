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

  @Column({ type: "double precision" })
  price: number;

  @Column({ type: "double precision", default: 0 })
  priceBase: number;

  @Column({ type: "double precision", default: 0 })
  priceUSD: bigint;

  @Column()
  paymentTokenAddress: string;

  static async getUnconverted(): Promise<Sale[]> {
    return this.createQueryBuilder("sale")
      .where("sale.priceBase = 0")
      .orWhere("sale.priceUSD = 0")
      .getMany();
  }
}
