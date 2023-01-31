import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fastifyFormbody from '@fastify/formbody'
import fastifyHelmet from '@fastify/helmet'
import fastifyNoIcon from 'fastify-no-icon'
import fastifyCors from '@fastify/cors'
import {
  plugin as supertokensPlugin,
  errorHandler,
} from 'supertokens-node/framework/fastify'
import supertokens from 'supertokens-node'
import fastifyCircuitBreaker from '@fastify/circuit-breaker'
import fastifyRateLimit from '@fastify/rate-limit'
import Redis from 'ioredis'
import GracefulServer from '@gquittet/graceful-server'
import fastifyHealthcheck from 'fastify-healthcheck'
import './supertokens'
import { changePassword } from './changePassword'
import { userInfo } from './userInfo'

const domainsWhitelistRegex = new RegExp(
  `^(https?:\/\/([a-z0-9]+[.])${process.env.SERVER_CORS_DOMAIN_NAME}[.]${process.env.SERVER_CORS_TLD}(?::\\d{1,5})?)$`,
  'gi'
)
const localhostDomainWhitelistRegex =
  /^(http(|s)?:\/\/([a-z0-9]+[.])localhost(?::\d{1,5})?)$/
const server: FastifyInstance = Fastify({
  logger: {
    level: 'debug'
  },
  trustProxy: Boolean(process.env.SERVER_TRUST_PROXY) || true,
  connectionTimeout: Number(process.env.SERVER_CONN_TIMEOUT) || 5000,
  requestTimeout: Number(process.env.SERVER_REQ_TIMEOUT) || 10000,
  bodyLimit: Number(process.env.SERVER_BODY_LIMIT) || 1048576,
})

const graceful = GracefulServer(server.server)

graceful.on(GracefulServer.READY, () => {
  console.log('Server is ready')
})

graceful.on(GracefulServer.SHUTTING_DOWN, () => {
  console.log('Server is shutting down')
})

graceful.on(GracefulServer.SHUTDOWN, (error) => {
  console.log('Server is down because of', error.message)
})

server.setErrorHandler(errorHandler())

server.register(fastifyFormbody)

server.register(fastifyHelmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
})

server.register(fastifyNoIcon)

server.register(fastifyCors, {
  origin: [
    domainsWhitelistRegex,
    localhostDomainWhitelistRegex,
    ...String(process.env.SERVER_CORS_EXTRA_ORIGINS).split(','),
  ],
  allowedHeaders: [
    'Content-Type',
    ...supertokens.getAllCORSHeaders(),
    ...String(process.env.SERVER_EXTRA_ALLOWED_HEADERS).split(','),
  ],
  credentials: true,
})

// @ts-ignore
server.register(fastifyCircuitBreaker, {
  threshold: 3,
  timeout: 5000,
  resetTimeout: 5000,
  onCircuitOpen: async (req: FastifyRequest, reply: FastifyReply) => {
    reply.statusCode = 500
    throw new Error(
      'The server is currently experiencing issues. Try again later.'
    )
  },
  onTimeout: async (req: FastifyRequest, reply: FastifyReply) => {
    reply.statusCode = 504
    return 'The server timed out. Try again later.'
  },
})

server.register(fastifyRateLimit, {
  global: true,
  max: Number(process.env.SERVER_RATE_LIMIT_MAX) ?? 1000,
  timeWindow:
    1000 * Number(process.env.SERVER_RATE_LIMIT_TIME_WINDOW) ?? 1000 * 60,
  cache: Number(process.env.SERVER_RATE_LIMIT_CACHE) ?? 5000,
  nameSpace: process.env.SERVER_RATE_LIMIT_NAMESPACE ?? 'supertokens-auth-api-',
  continueExceeding: false,
  skipOnError: false,
  hook: 'preHandler',
  allowList: ['127.0.0.1', '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
  redis: new Redis({ host: process.env.REDIS_HOST, db: Number(process.env.REDIS_DB) || 0 }),
})

server.register(require('@immobiliarelabs/fastify-sentry'), {
  dsn: process.env.SERVER_SENTRY_DSN ?? '',
  environment: process.env.ENVIRONMENT ?? 'unspecified',
  release: process.env.npm_package_version,
})

server.register(fastifyHealthcheck)

server.register(changePassword)
server.register(userInfo)

server.register(supertokensPlugin)

server.all('/', (req, res) => {
  res.redirect(process.env.ROOT_PATH_REDIRECT || 'http://localhost:3000')
})

const start = async () => {
  const serverPort: number = process.env.SERVER_PORT
    ? Number(process.env.SERVER_PORT)
    : 3000
  const serverHost: string = process.env.SERVER_HOST
    ? process.env.SERVER_HOST
    : '0.0.0.0'
  try {
    await server.listen({ port: serverPort, host: serverHost })
    graceful.setReady()
  } catch (e) {
    server.log.error(e)
    process.exit(1)
  }
}

start()
