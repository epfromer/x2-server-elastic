import cors from 'cors'
import * as dotenv from 'dotenv'
import express, { Application } from 'express'
import { graphqlHTTP } from 'express-graphql'
import { graphqlSchema } from './common'
import root from './root'

// https://www.elastic.co/blog/new-elasticsearch-javascript-client-released
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/introduction.html
// http://localhost:9200/x2
// http://localhost:9200/x2/_search?q=*

dotenv.config()
const VERBOSE = process.env.VERBOSE === '1'
console.log('VERBOSE', VERBOSE)

const app = express()
app.use(cors())
app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: root,
    graphiql: true,
    customFormatErrorFn: (error) => ({
      message: error.message,
      locations: error.locations,
      stack: error.stack ? error.stack.split('\n') : [],
      path: error.path,
    }),
  }) as Application
)
app.get('/', function (req, res) {
  res.send(
    'x2-server-elastic: GraphQL interface on email in ElasticSearch for X2 client'
  )
})

const port = process.env.PORT || 80
app.listen(port, () => console.log(`elastic on port ${port}`))
