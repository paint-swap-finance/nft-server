import {
  Decorator,
  Query,
  Table,
} from '@serverless-seoul/dynamorm'
import { Blockchain } from '../types'

@Decorator.Table({ name: 'nft-historical-metrics-prod' })
export class HistoricalMetric extends Table {
  @Decorator.FullPrimaryKey('address', 'timestamp')
  public static readonly primaryKey: Query.FullPrimaryKey<HistoricalMetric, string, number>

  @Decorator.FullGlobalSecondaryIndex('chain', 'timestamp')
  public static readonly chainIndex: Query.FullGlobalSecondaryIndex<HistoricalMetric, string, number>

  @Decorator.Writer()
  public static readonly writer: Query.Writer<HistoricalMetric>

  @Decorator.Attribute()
  public address: string

  @Decorator.Attribute()
  public timestamp: number

  @Decorator.Attribute()
  public chain: Blockchain

  @Decorator.Attribute()
  public dailyVolume: number

  @Decorator.Attribute()
  public dailyVolumeUSD: number

  @Decorator.Attribute()
  public totalVolume: number

  @Decorator.Attribute()
  public totalVolumeUSD: number

  @Decorator.Attribute()
  public marketCap: number

  @Decorator.Attribute()
  public marketCapUSD: number

  @Decorator.Attribute()
  public floor: number

  @Decorator.Attribute()
  public floorUSD: number

  @Decorator.Attribute()
  public owners: number
}