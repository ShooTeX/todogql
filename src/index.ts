import { ApolloServer, gql, addErrorLoggingToSchema } from 'apollo-server'
import admin from 'firebase-admin'
import serviceAccountCredentials from './service-account.json'

const serviceAccount = serviceAccountCredentials as admin.ServiceAccount

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

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
  }
`

const resolvers = {
  Query: {
    async items () {
      const items = await admin
        .firestore()
        .collection('items')
        .get()
      return items.docs.map(item => item.data())
    }
  },
  Mutation: {
    async addItem (_: any, args: any) {
      await admin
        .firestore()
        .collection('items')
        .doc()
        .set({ title: args.title, checked: args.checked })
      return ({ title: args.title, checked: args.checked })
    }
  }
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`)
},
(e) => console.log(e))
