import { dbName, searchHistoryCollection, SearchHistoryEntry } from './common'
import { Client } from '@elastic/elasticsearch'

export async function getSearchHistory(): Promise<Array<SearchHistoryEntry>> {
  const client = new Client({
    node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`,
  })
  const { body } = await client.search({
    index: dbName + searchHistoryCollection,
    q: '*',
    sort: 'timestamp:desc',
  })
  return body.hits.hits.map((entry: any) => ({
    id: entry._id,
    timestamp: entry._source.timestamp,
    entry: entry._source.entry,
  }))
}

export async function clearSearchHistory(): Promise<string> {
  const client = new Client({
    node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`,
  })
  await client.indices.delete({ index: dbName + searchHistoryCollection })
  await client.indices.create({ index: dbName + searchHistoryCollection })
  return `Search history cleared`
}
