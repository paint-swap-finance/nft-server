import {
  Decorator,
  Query,
  Table,
} from '@serverless-seoul/dynamorm'

import { Blockchain } from '../types'

interface Filters {
  chain: Blockchain
}

@Decorator.Table({ name: 'nft-collections-prod' })
export class Collection extends Table {
  @Decorator.FullPrimaryKey('address', 'nameLowercase')
  public static readonly primaryKey: Query.FullPrimaryKey<Collection, string, string> 

  @Decorator.LocalSecondaryIndex('symbol')
  public static readonly symbolIndex: Query.LocalSecondaryIndex<Collection, Query.FullPrimaryKey<Collection, string, string>, string>

  @Decorator.Writer()
  public static readonly writer: Query.Writer<Collection>

  @Decorator.Attribute()
  public address: string

  @Decorator.Attribute()
  public chain: Blockchain

  @Decorator.Attribute()
  public slug: string

  @Decorator.Attribute()
  public name: string

  @Decorator.Attribute()
  public nameLowercase: string

  @Decorator.Attribute()
  public symbol: string

  @Decorator.Attribute()
  public description: string

  @Decorator.Attribute()
  public links: {
    logo: string
    website?: string
    discord?: string
    telegram?: string
    twitter?: string
    medium?: string
  }

  public static async all({ chain = Blockchain.Any }: Filters): Promise<Collection[]> {
    const results = await Collection.metadata.connection.documentClient.scan({
      TableName: Collection.metadata.name,
    }).promise()

    const filteredResults = results.Items.filter(item => chain === Blockchain.Any || item.chain === chain)

    return filteredResults.map(item => {
      const collection = new Collection()
      collection.setAttributes({...item})
      return collection
    })
  }
}