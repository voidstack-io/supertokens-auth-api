import { verifySession } from 'supertokens-node/recipe/session/framework/fastify'
import { SessionRequest } from 'supertokens-node/framework/fastify'
import { FastifyInstance } from 'fastify'
import UserMetadata from 'supertokens-node/recipe/usermetadata'

export const userInfo = async (fastify: FastifyInstance, options: any) => {
  fastify.post(
    '/user/:keyName',
    {
      preHandler: verifySession(),
    },
    async (req: SessionRequest, res) => {
      const session = req.session
      const userId = session!.getUserId()
      // @ts-ignore
      const { keyName } = req.params
      let kv = {}
      // @ts-ignore
      kv[keyName] = req.body.value
      // @ts-ignore
      await UserMetadata.updateUserMetadata(userId, kv)
      res.send({ message: `successfully updated user ${keyName}` })
    }
  )
  fastify.get(
    '/user/:keyName',
    {
      preHandler: verifySession(),
    },
    async (req: SessionRequest, res) => {
      const session = req.session
      const userId = session!.getUserId()
      // @ts-ignore
      const { keyName } = req.params
      const { metadata } = await UserMetadata.getUserMetadata(userId)
      let kv = {}
      // @ts-ignore
      kv[keyName] = metadata[keyName]
      res.send(kv)
    }
  )
  fastify.delete(
    '/user/:keyName',
    {
      preHandler: verifySession(),
    },
    async (req: SessionRequest, res) => {
      const session = req.session
      const userId = session!.getUserId()
      // @ts-ignore
      const { keyName } = req.params
      let kv = {}
      // @ts-ignore
      kv[keyName] = null
      await UserMetadata.updateUserMetadata(userId, kv)
      res.send({ message: `successfully updated user ${keyName}` })
    }
  )
}
