import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { Collection } from "./collection";

enum Marketplace {
  Opensea = "opensea",
}

@Entity()
export class Sale extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Collection, collection => collection.sales)
  @JoinColumn()
  collection: Collection;

  @Column({ type: "timestamptz" })
  timestamp: Date;

  @Column()
  fromAddress: string;

  @Column()
  toAddress: string;

  @Column()
  marketplace: Marketplace;

  @Column({ type: "double precision" })
  price: number;

  @Column()
  paymentTokenAddress: string;
}