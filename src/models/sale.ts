import {
  Decorator,
  Query,
  Table,
} from '@serverless-seoul/dynamorm'

enum Marketplace {
  Opensea = 'opensea',
}

@Decorator.Table({ name: 'nft-sales-prod' })
export class Sale extends Table {
  @Decorator.FullPrimaryKey('address', 'timestamp')
  public static readonly primaryKey: Query.FullPrimaryKey<Sale, string, number>

  @Decorator.Writer()
  public static readonly writer: Query.Writer<Sale>

  @Decorator.Attribute()
  public address: string

  @Decorator.Attribute()
  public timestamp: number

  @Decorator.Attribute()
  public fromAddress: string

  @Decorator.Attribute()
  public toAddress: string

  @Decorator.Attribute()
  public marketplace: Marketplace

  @Decorator.Attribute()
  public price: number

  @Decorator.Attribute()
  public tokenAddress: string
}