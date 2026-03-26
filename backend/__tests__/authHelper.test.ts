import { jest } from '@jest/globals'

// 1. ALL MOCKS MUST BE AT THE TOP
jest.unstable_mockModule('../src/config/env.config', () => ({
    APPLE_CLIENT_ID_WEB: 'apple-client-id-web',
    APPLE_CLIENT_ID_MOBILE: 'apple-client-id-mobile',
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_MOBILE_CLIENT_ID: 'google-mobile-client-id',
    FACEBOOK_APP_ID: 'fb-app-id',
    FACEBOOK_APP_SECRET: 'fb-secret',
}))

jest.unstable_mockModule('jose', () => ({
  __esModule: true,
  createRemoteJWKSet: jest.fn(() => ({})),
  jwtVerify: jest.fn(),
}))

jest.unstable_mockModule('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}))

/** Mock return type for `OAuth2Client#verifyIdToken` ticket */
type GoogleIdTokenTicket = { getPayload: () => { email?: string } | undefined }

const mockVerifyGoogleIdToken = jest.fn() as jest.MockedFunction<
  (options: { idToken: string; audience: string[] }) => Promise<GoogleIdTokenTicket>
>

jest.unstable_mockModule('google-auth-library', () => ({
  __esModule: true,
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyGoogleIdToken,
  })),
}))

// 2. DYNAMIC IMPORTS - ORDER MATTERS
await import('../src/config/env.config')
const axios = (await import('axios')).default
const jose = await import('jose')

// Import the helper LAST so it picks up the mocked env
const authHelper = await import('../src/utils/authHelper')

const mockedAxios = axios as jest.Mocked<typeof axios>
const mockedJose = jose as jest.Mocked<typeof jose>

describe('Social Auth Helper (ESM)', () => {
  const mockEmail = 'test@example.com'
  const mockToken = 'mock-token.header.payload.signature'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('verifyAppleToken', () => {
    it('should return true for a valid Apple token', async () => {
      // @ts-expect-error - jwtVerify is replaced by a Jest mock function during unstable_mockModule
      mockedJose.jwtVerify.mockResolvedValue({
        payload: {
          email: mockEmail,
          email_verified: true,
          sub: 'apple-user-id',
        },
      })

      const result = await authHelper.verifyAppleToken(mockToken, mockEmail)
      expect(result).toBe(true)
    })

    it('should return false if email_verified is false', async () => {
      // @ts-expect-error - jwtVerify is replaced by a Jest mock function during unstable_mockModule
      mockedJose.jwtVerify.mockResolvedValue({
        payload: { email: mockEmail, email_verified: false, sub: 'id' },
      })

      const result = await authHelper.verifyAppleToken(mockToken, mockEmail)
      expect(result).toBe(false)
    })
  })

  describe('verifyGoogleToken', () => {
    it('should return true when verifyIdToken payload email matches', async () => {
      mockVerifyGoogleIdToken.mockResolvedValue({
        getPayload: () => ({ email: mockEmail }),
      })

      const result = await authHelper.verifyGoogleToken(mockToken, mockEmail)
      expect(result).toBe(true)
      expect(mockVerifyGoogleIdToken).toHaveBeenCalledWith({
        idToken: mockToken,
        audience: ['google-client-id', 'google-mobile-client-id'],
      })
    })

    it('should return false if payload email does not match', async () => {
      mockVerifyGoogleIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'other@example.com' }),
      })

      const result = await authHelper.verifyGoogleToken(mockToken, mockEmail)
      expect(result).toBe(false)
    })

    it('should return false if getPayload returns undefined', async () => {
      mockVerifyGoogleIdToken.mockResolvedValue({
        getPayload: () => undefined,
      })

      const result = await authHelper.verifyGoogleToken(mockToken, mockEmail)
      expect(result).toBe(false)
    })

    it('should reject if verifyIdToken throws (invalid token / audience)', async () => {
      mockVerifyGoogleIdToken.mockRejectedValue(new Error('Wrong recipient'))

      await expect(authHelper.verifyGoogleToken(mockToken, mockEmail)).rejects.toThrow('Wrong recipient')
    })
  })

  describe('verifyFacebookToken', () => {
    it('should return true for valid FB flow', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: { is_valid: true, app_id: 'fb-app-id' },
        },
      })
      mockedAxios.get.mockResolvedValueOnce({
        data: { email: mockEmail },
      })

      const result = await authHelper.verifyFacebookToken(mockToken, mockEmail)
      expect(result).toBe(true)
    })
  })
})
