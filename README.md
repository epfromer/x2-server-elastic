# x2-server-elastic

GraphQL interface on email in ElasticSearch for X2 client.

To run ElasticSearch in a Docker container, use:

```bash
docker run --name elastic -p 9200:9200 -p 9300:9300 -e 'discovery.type=single-node' docker.elastic.co/elasticsearch/elasticsearch:7.9.0
```
