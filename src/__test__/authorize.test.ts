import axios from 'axios'
import { io } from 'socket.io-client'

import { fixtureStart, fixtureStop } from './fixture'

describe('authorize - with secret as string in options', () => {
  let token: string = ''

  beforeEach(async (done) => {
    jest.setTimeout(15_000)
    await fixtureStart(async () => {
      const response = await axios.post('http://localhost:9000/login')
      token = response.data.token
      done()
    })
  })

  afterEach((done) => {
    fixtureStop(done)
  })

  it('should emit error with no token provided', (done) => {
    const socket = io('http://localhost:9000')
    socket.on('connect_error', (err: any) => {
      expect(err.data.message).toEqual('no token provided')
      expect(err.data.code).toEqual('credentials_required')
      socket.close()
      done()
    })
  })

  it('should emit error with bad token format', (done) => {
    const socket = io('http://localhost:9000', {
      auth: { token: 'testing' }
    })
    socket.on('connect_error', (err: any) => {
      expect(err.data.message).toEqual(
        'Format is Authorization: Bearer [token]'
      )
      expect(err.data.code).toEqual('credentials_bad_format')
      socket.close()
      done()
    })
  })

  it('should emit error with unauthorized handshake', (done) => {
    const socket = io('http://localhost:9000', {
      auth: { token: 'Bearer testing' }
    })
    socket.on('connect_error', (err: any) => {
      expect(err.data.message).toEqual(
        'Unauthorized: Token is missing or invalid Bearer'
      )
      expect(err.data.code).toEqual('invalid_token')
      socket.close()
      done()
    })
  })

  it('should connect the user', (done) => {
    const socket = io('http://localhost:9000', {
      auth: { token: `Bearer ${token}` }
    })
    socket.on('connect', () => {
      socket.close()
      done()
    })
  })
})

const secretCallback = async (): Promise<string> => {
  return 'somesecret'
}

describe('authorize - with secret as callback in options', () => {
  let token: string = ''

  beforeEach(async (done) => {
    jest.setTimeout(15_000)
    await fixtureStart(
      async () => {
        const response = await axios.post('http://localhost:9000/login')
        token = response.data.token
        done()
      },
      { secret: secretCallback }
    )
  })

  afterEach((done) => {
    fixtureStop(done)
  })

  it('should connect the user', (done) => {
    const socket = io('http://localhost:9000', {
      auth: { token: `Bearer ${token}` }
    })
    socket.on('connect', () => {
      socket.close()
      done()
    })
  })
})
