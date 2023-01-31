import supertokens from 'supertokens-node'
import ThirdPartyEmailPassword, {
  Apple,
  Discord,
  Facebook,
  Github,
  Google,
  GoogleWorkspaces,
  TypeProvider,
} from 'supertokens-node/recipe/thirdpartyemailpassword'
import Session from 'supertokens-node/recipe/session'
import Dashboard from 'supertokens-node/recipe/dashboard'
import * as crypto from 'node:crypto'
import EmailVerification from 'supertokens-node/recipe/emailverification'
import UserMetadata from 'supertokens-node/recipe/usermetadata'

const supertokensConn: { connectionURI: string; apiKey?: string | undefined } =
  {
    connectionURI:
      process.env.SUPERTOKENS_CONNECTION_URI || 'http://localhost:3567',
    apiKey: process.env.SUPERTOKENS_API_KEY || undefined,
  }

const getEmailVerificationMode = (): 'REQUIRED' | 'OPTIONAL' => {
  const envSet: string | boolean =
    process.env.SUPERTOKENS_EMAIL_VERIFICATION_MODE || false
  const valRegEx = /^(OPTIONAL|REQUIRED)$/

  if (!envSet) {
    return 'OPTIONAL'
  }

  if (valRegEx.exec(envSet)) {
    if (envSet === 'OPTIONAL') {
      return 'OPTIONAL'
    }
    if (envSet === 'REQUIRED') {
      return 'REQUIRED'
    }
  }
  return 'OPTIONAL'
}

const buildThirdPartyProviders = () => {
  const enabledProviders =
    String(process.env.SUPERTOKENS_ENABLE_THIRDPARTY_PROVIDERS).split(',') || []
  if (enabledProviders.length === 0) {
    return []
  }

  let providers: TypeProvider[] = []

  enabledProviders.forEach((val) => {
    switch (val.toLowerCase()) {
      case 'google':
        providers.push(
          Google({
            clientId: process.env.SUPERTOKENS_GOOGLE_CLIENT_ID
              ? process.env.SUPERTOKENS_GOOGLE_CLIENT_ID
              : '1060725074195-kmeum4crr01uirfl2op9kd5acmi9jutn.apps.googleusercontent.com',
            clientSecret: process.env.SUPERTOKENS_GOOGLE_CLIENT_SECRET
              ? process.env.SUPERTOKENS_GOOGLE_CLIENT_SECRET
              : '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',
          })
        )
        break
      case 'github':
        providers.push(
          Github({
            clientId: process.env.SUPERTOKENS_GITHUB_CLIENT_ID
              ? process.env.SUPERTOKENS_GITHUB_CLIENT_ID
              : '467101b197249757c71f',
            clientSecret: process.env.SUPERTOKENS_GITHUB_CLIENT_SECRET
              ? process.env.SUPERTOKENS_GITHUB_CLIENT_SECRET
              : 'e97051221f4b6426e8fe8d51486396703012f5bd',
          })
        )
        break
      case 'facebook':
        providers.push(
          Facebook({
            clientId: process.env.SUPERTOKENS_FACEBOOK_CLIENT_ID
              ? process.env.SUPERTOKENS_FACEBOOK_CLIENT_ID
              : '',
            clientSecret: process.env.SUPERTOKENS_FACEBOOK_CLIENT_SECRET
              ? process.env.SUPERTOKENS_FACEBOOK_CLIENT_SECRET
              : '',
          })
        )
        break
      case 'apple':
        providers.push(
          Apple({
            clientSecret: {
              teamId: process.env.SUPERTOKENS_APPLE_TEAM_ID
                ? process.env.SUPERTOKENS_APPLE_TEAM_ID
                : 'YWQCXGJRJL',
              privateKey: process.env.SUPERTOKENS_APPLE_PRIVATE_KEY
                ? process.env.SUPERTOKENS_APPLE_PRIVATE_KEY
                : '-----BEGIN PRIVATE KEY-----\\nMIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgu8gXs+XYkqXD6Ala9Sf/iJXzhbwcoG5dMh1OonpdJUmgCgYIKoZIzj0DAQehRANCAASfrvlFbFCYqn3I2zeknYXLwtH30JuOKestDbSfZYxZNMqhF/OzdZFTV0zc5u5s3eN+oCWbnvl0hM+9IW0UlkdA\\n-----END PRIVATE KEY-----',
              keyId: process.env.SUPERTOKENS_APPLE_KEY_ID
                ? process.env.SUPERTOKENS_APPLE_KEY_ID
                : '7M48Y4RYDL',
            },
            clientId: process.env.SUPERTOKENS_APPLE_CLIENT_ID
              ? process.env.SUPERTOKENS_APPLE_CLIENT_ID
              : '4398792-io.supertokens.example.service',
          })
        )
        break
      case 'discord':
        providers.push(
          Discord({
            clientId: process.env.SUPERTOKENS_DISCORD_CLIENT_ID
              ? process.env.SUPERTOKENS_DISCORD_CLIENT_ID
              : '',
            clientSecret: process.env.SUPERTOKENS_DISCORD_CLIENT_SECRET
              ? process.env.SUPERTOKENS_DISCORD_CLIENT_SECRET
              : '',
          })
        )
        break
      case 'googleworkspace':
        providers.push(
          GoogleWorkspaces({
            clientId: process.env.SUPERTOKENS_GOOGLE_WORKSPACE_CLIENT_ID
              ? process.env.SUPERTOKENS_GOOGLE_WORKSPACE_CLIENT_ID
              : '',
            clientSecret: process.env.SUPERTOKENS_GOOGLE_WORKSPACE_CLIENT_SECRET
              ? process.env.SUPERTOKENS_GOOGLE_WORKSPACE_CLIENT_SECRET
              : '',
          })
        )
        break
      default:
        throw new Error(`invalid thirdpart provider: ${val}`)
    }
  })

  return providers
}

const dashboardApiKey = (): string => {
  let envProvided: boolean
  let key: string

  process.env.SUPERTOKENS_DASHBOARD_API_KEY
    ? (envProvided = true)
    : (envProvided = false)

  if (envProvided) {
    key = process.env.SUPERTOKENS_DASHBOARD_API_KEY!
  } else {
    key = crypto.randomBytes(17).toString('hex')
    console.log(`RANDOM DASHBOARD KEY: ${key}`)
  }
  return key
}

supertokens.init({
  framework: 'fastify',
  supertokens: supertokensConn,
  appInfo: {
    appName: process.env.SUPERTOKEN_APP_NAME || 'supertokens-auth-api',
    apiDomain: process.env.SUPERTOKENS_API_DOMAIN || 'http://localhost:3000',
    websiteDomain:
      process.env.SUPERTOKENS_WEBSITE_DOMAIN || 'http://localhost:30001',
    apiBasePath: '/',
    websiteBasePath: process.env.SUPERTOKEN_WEBSITE_BASE_PATH || '/auth',
  },
  recipeList: [
    ThirdPartyEmailPassword.init({
      providers: buildThirdPartyProviders(),
    }),
    Dashboard.init({
      apiKey: dashboardApiKey(),
    }),
    EmailVerification.init({
      mode: getEmailVerificationMode(),
    }),
    Session.init({
      cookieSecure: Boolean(process.env.SUPERTOKENS_COOKIE_SECURE) || true,
    }),
    UserMetadata.init(),
  ],
})
