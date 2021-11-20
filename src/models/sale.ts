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

  @Column()
  paymentTokenAddress: string;
}
