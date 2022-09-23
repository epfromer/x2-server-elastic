import { Client } from '@elastic/elasticsearch'
import {
  Custodian,
  custodianCollection,
  dbName,
  emailCollection,
  Email,
  EmailSentByDay,
  emailSentByDayCollection,
  getNumPSTs,
  processCustodians,
  processEmailSentByDay,
  processWordCloud,
  searchHistoryCollection,
  walkFSfolder,
  wordCloudCollection,
  WordCloudTag,
} from './common'
import { v4 as uuidv4 } from 'uuid'

// https://www.elastic.co/blog/new-elasticsearch-javascript-client-released
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/introduction.html
// http://localhost:9200/x2
// http://localhost:9200/x2/_search?q=*

const processSend = (msg: string) => {
  if (!process || !process.send) {
    console.error('no process object or process.end undefined')
    return
  }
  process.send(msg)
}

async function run() {
  if (!process.env.ELASTIC_HOST) {
    throw 'MONGODB_HOST undefined'
  }

  if (!getNumPSTs(process.argv[2])) {
    processSend(`no PSTs found in ${process.argv[2]}`)
    return
  }

  processSend(
    `connect to http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`
  )
  const client = new Client({
    node: `http://${process.env.ELASTIC_HOST}:${process.env.ELASTIC_PORT}`,
  })

  const insertEmails = async (emails: Email[]): Promise<void> => {
    emails.forEach(async (email) => {
      await client.index({
        index: dbName + emailCollection,
        body: {
          id: uuidv4(),
          sent: new Date(email.sent).toISOString(),
          from: email.from,
          fromCustodian: email.fromCustodian,
          to: email.to,
          toCustodians: email.toCustodians,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          body: email.body,
        },
      })
    })
  }

  const insertWordCloud = async (wordCloud: WordCloudTag[]): Promise<void> => {
    await client.index({
      index: dbName + wordCloudCollection,
      body: {
        wordCloudCollection: wordCloud,
      },
    })
  }

  const insertEmailSentByDay = async (
    email: EmailSentByDay[]
  ): Promise<void> => {
    await client.index({
      index: dbName + emailSentByDayCollection,
      body: {
        emailSentCollection: email,
      },
    })
  }

  const insertCustodians = async (custodians: Custodian[]): Promise<void> => {
    custodians.forEach(async (custodian) => {
      await client.index({
        index: dbName + custodianCollection,
        id: custodian.id,
        body: {
          id: custodian.id,
          name: custodian.name,
          title: custodian.title,
          color: custodian.color,
          senderTotal: custodian.senderTotal,
          receiverTotal: custodian.receiverTotal,
          toCustodians: custodian.toCustodians,
        },
      })
    })
  }

  processSend(`drop database`)
  try {
    await client.indices.delete({ index: dbName + emailCollection })
    await client.indices.delete({ index: dbName + wordCloudCollection })
    await client.indices.delete({ index: dbName + emailSentByDayCollection })
    await client.indices.delete({ index: dbName + custodianCollection })
    await client.indices.delete({ index: dbName + searchHistoryCollection })
  } catch (error) {
    console.error(error)
  }

  processSend(`create index`)
  await client.indices.create({ index: dbName + emailCollection })
  await client.indices.create({ index: dbName + wordCloudCollection })
  await client.indices.create({ index: dbName + emailSentByDayCollection })
  await client.indices.create({ index: dbName + custodianCollection })
  await client.indices.create({ index: dbName + searchHistoryCollection })

  processSend(`process emails`)
  const numEmails = await walkFSfolder(process.argv[2], insertEmails, (msg) =>
    processSend(msg)
  )

  processSend(`process word cloud`)
  await processWordCloud(insertWordCloud, (msg) => processSend(msg))

  processSend(`process email sent`)
  await processEmailSentByDay(insertEmailSentByDay, (msg) => processSend(msg))

  processSend(`process custodians`)
  await processCustodians(insertCustodians, (msg) => processSend(msg))

  processSend(`refresh index`)
  await client.indices.refresh({ index: dbName + emailCollection })
  await client.indices.refresh({ index: dbName + wordCloudCollection })
  await client.indices.refresh({ index: dbName + emailSentByDayCollection })
  await client.indices.refresh({ index: dbName + custodianCollection })

  processSend(`completed ${numEmails} emails in ${process.argv[2]}`)
}

run().catch((err) => console.error(err))
