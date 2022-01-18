aws dynamodb create-table \
    --table-name dev-nft-table \
    --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=category,AttributeType=S AttributeName=totalVolumeUSD,AttributeType=N \
    --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
    --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"collectionsIndex\",
        \"KeySchema\": [{\"AttributeName\":\"category\",\"KeyType\":\"HASH\"},
                        {\"AttributeName\":\"totalVolumeUSD\",\"KeyType\":\"RANGE\"}],
        \"Projection\":{
            \"ProjectionType\":\"INCLUDE\",
            \"NonKeyAttributes\":[
              \"address\",
              \"name\",
              \"logo\",
              \"totalVolume\",
              \"totalVolumeUSD\",
              \"dailyVolume\",
              \"dailyVolumeUSD\",
              \"floor\",
              \"floorUSD\",
              \"owners\",
              \"chains\",
              \"marketplaces\"
            ]
        }
      }
    ]" \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES \
    --billing-mode PAY_PER_REQUEST \
    --endpoint-url http://localhost:8000