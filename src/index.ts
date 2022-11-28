import { ApolloServer, gql, addErrorLoggingToSchema } from 'apollo-server'
import admin from 'firebase-admin'

const envCredentials = process.env.FIREBASE_SERVICE_ACCOUNT && JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

(async () => {
  admin.initializeApp({
    credential: admin.credential.cert(envCredentials ?? await import('./service-account.json') as admin.ServiceAccount)
  })
})().catch(e => console.error(e))

const typeDefs = gql`
  type Item {
    title: String!
    checked: Boolean!
    id: ID!
  }
  type Query {
    items: [Item]
  }
  type Mutation {
    addItem(title: String!, checked: Boolean!): Item
    deleteItem(id: String!): ID
    checkItem(id: String!, checked: Boolean!): Item
  }
`

const resolvers = {
  Query: {
    async items () {
      const items = await admin
        .firestore()
        .collection('items')
        .get()
      return items.docs.map(item => ({ ...item.data(), id: item.id }))
    }
  },
  Mutation: {
    async addItem (_: any, args: any) {
      let id = ''
      await admin
        .firestore()
        .collection('items')
        .add({ title: args.title, checked: args.checked })
        .then(doc => { id = doc.id })
      return ({ title: args.title, checked: args.checked, id })
    },
    async deleteItem (_: any, args: any) {
      await admin
        .firestore()
        .collection('items')
        .doc(args.id)
        .delete()
      return args.id
    },
    async checkItem (_: any, args: any) {
      await admin
        .firestore()
        .collection('items')
        .doc(args.id)
        .update({ checked: args.checked })
      return ({ id: args.id, checked: args.checked })
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen({ port: process.env.PORT !== null ? process.env.PORT : 4000 }).then(({ url }) => {
  console.log(`Server ready at ${url}`)
},
(e) => console.log(e))
