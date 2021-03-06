import { ApolloServer } from 'apollo-server-micro';
import requestIp from 'request-ip';
import Cookies from 'cookies';
import shortid from 'shortid';
import typeDefs from '../../apollo/type-defs';
import resolvers from '../../apollo/resolvers';
import PostgresDB from '../../datasource/postgres';
import Pool from '../../postgresPool';

const postgres = new PostgresDB({ pool: Pool });

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({ postgres }),
  context: ({ req, res }) => {
    const cookies = new Cookies(req, res);
    let cookieId = cookies.get('id');
    if (!cookieId) {
      cookieId = shortid.generate();
      cookies.set('id', cookieId, { sameSite: true });
    }
    return ({
      ip: requestIp.getClientIp(req),
      cookieId,
    });
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default apolloServer.createHandler({ path: '/api/graphql' });
