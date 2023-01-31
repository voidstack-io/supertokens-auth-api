import ThirdPartyEmailPassword from 'supertokens-node/recipe/thirdpartyemailpassword'
import { verifySession } from 'supertokens-node/recipe/session/framework/fastify'
import { SessionRequest } from 'supertokens-node/framework/fastify'
import { FastifyInstance } from 'fastify'
import Session from 'supertokens-node/recipe/session'

export const changePassword = async (
  fastify: FastifyInstance,
  options: any
) => {
  fastify.post(
    '/change-password',
    {
      preHandler: verifySession(),
    },
    async (req: SessionRequest, res) => {
      let session = req.session
      // @ts-ignore
      let oldPassword = req.body.oldPassword
      // @ts-ignore
      let updatedPassword = req.body.newPassword
      let userId = session!.getUserId()
      let userInfo = await ThirdPartyEmailPassword.getUserById(userId)
      if (userInfo === undefined) {
        throw new Error('Please check credentials.')
      }
      let isPasswordValid = await ThirdPartyEmailPassword.emailPasswordSignIn(
        userInfo.email,
        oldPassword
      )
      if (isPasswordValid.status !== 'OK') {
        // TODO: handle incorrect password error
        return
      } else {
        return 'Please check credentials.'
      }
      let response = await ThirdPartyEmailPassword.updateEmailOrPassword({
        userId,
        password: updatedPassword,
      })

      await Session.revokeAllSessionsForUser(userId)
      await req.session!.revokeSession()

      if (response.status === 'OK') {
        return 'Credentials successfully updated. Please login again.'
      } else {
        return 'The server encountered an error. Try again later.'
      }
    }
  )
}
