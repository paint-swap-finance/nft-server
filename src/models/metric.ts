import {
  Decorator,
  Query,
  Table,
} from '@serverless-seoul/dynamorm';
import { Collection } from '.';
import { Blockchain } from '../types'

enum MetricName {
  Floor = 'floor',
  DailyVolume = 'dailyVolume',
  TotalVolume = 'totalVolume',
  MarketCap = 'marketCap',
  OwnerCount = 'ownerCount',
}

@Decorator.Table({ name: 'nft-metrics-prod' })
export class Metric extends Table {
  @Decorator.HashPrimaryKey('address')
  public static readonly primaryKey: Query.HashPrimaryKey<Metric, string>

  @Decorator.FullGlobalSecondaryIndex('name', 'value')
  public static readonly nameIndex: Query.FullGlobalSecondaryIndex<Metric, MetricName, number>;

  @Decorator.FullGlobalSecondaryIndex('chain', 'nameValueSK')
  public static readonly chainIndex: Query.FullGlobalSecondaryIndex<Metric, Blockchain, string>;
  
  @Decorator.Writer()
  public static readonly writer: Query.Writer<Metric>

  @Decorator.Attribute()
  public address: string

  @Decorator.Attribute()
  public name: MetricName

  @Decorator.Attribute()
  public value: number

  @Decorator.Attribute()
  public valueUSD: number | undefined

  @Decorator.Attribute()
  public chain: Blockchain;

  @Decorator.Attribute()
  private nameValueSK: string

  public static async all(): Promise<Metric[]> {
    const results = await Metric.metadata.connection.documentClient.scan({
      TableName: Metric.metadata.name,
    }).promise()

    return results.Items.map(item => {
      const metric = new Metric()
      metric.setAttributes({...item})
      return metric
    })
  }

  public static async getTopCollectionsByMetric(metric: MetricName, limit: number | undefined): Promise<Collection[]> {
    const results = await Metric.nameIndex.query({ hash: metric, rangeOrder: 'DESC', limit: limit })
    const collectionAddresses = results.records.map(metric => metric.address)
    const collectionResults = await Collection.primaryKey.batchGet(collectionAddresses)
    return collectionResults.records
  }
}