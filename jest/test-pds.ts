import {AddressInfo} from 'net'
import os from 'os'
import path from 'path'
import * as crypto from '@atproto/crypto'
import {PDS, ServerConfig, Database, MemoryBlobStore} from '@atproto/pds'
import * as plc from '@did-plc/lib'
import {PlcServer, Database as PlcDatabase} from '@did-plc/server'
import {BskyAgent} from '@atproto/api'

const ADMIN_PASSWORD = 'admin-pass'
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60

export interface TestUser {
  email: string
  did: string
  handle: string
  password: string
  agent: BskyAgent
}

export interface TestPDS {
  pdsUrl: string
  mocker: Mocker
  close: () => Promise<void>
}

export async function createServer(): Promise<TestPDS> {
  const repoSigningKey = await crypto.Secp256k1Keypair.create()
  const plcRotationKey = await crypto.Secp256k1Keypair.create()

  const plcDb = PlcDatabase.mock()

  const plcServer = PlcServer.create({db: plcDb})
  const plcListener = await plcServer.start()
  const plcPort = (plcListener.address() as AddressInfo).port
  const plcUrl = `http://localhost:${plcPort}`

  const recoveryKey = (await crypto.Secp256k1Keypair.create()).did()

  const plcClient = new plc.Client(plcUrl)
  const serverDid = await plcClient.createDid({
    signingKey: repoSigningKey.did(),
    rotationKeys: [recoveryKey, plcRotationKey.did()],
    handle: 'localhost',
    pds: 'https://pds.public.url',
    signer: plcRotationKey,
  })

  const blobstoreLoc = path.join(os.tmpdir(), crypto.randomStr(5, 'base32'))

  const cfg = new ServerConfig({
    debugMode: true,
    version: '0.0.0',
    scheme: 'http',
    hostname: 'localhost',
    serverDid,
    recoveryKey,
    adminPassword: ADMIN_PASSWORD,
    inviteRequired: false,
    didPlcUrl: plcUrl,
    jwtSecret: 'jwt-secret',
    availableUserDomains: ['.test'],
    appUrlPasswordReset: 'app://forgot-password',
    emailNoReplyAddress: 'noreply@blueskyweb.xyz',
    publicUrl: 'https://pds.public.url',
    imgUriSalt: '9dd04221f5755bce5f55f47464c27e1e',
    imgUriKey:
      'f23ecd142835025f42c3db2cf25dd813956c178392760256211f9d315f8ab4d8',
    dbPostgresUrl: process.env.DB_POSTGRES_URL,
    blobstoreLocation: `${blobstoreLoc}/blobs`,
    blobstoreTmp: `${blobstoreLoc}/tmp`,
    maxSubscriptionBuffer: 200,
    repoBackfillLimitMs: HOUR,
  })

  const db =
    cfg.dbPostgresUrl !== undefined
      ? Database.postgres({
          url: cfg.dbPostgresUrl,
          schema: cfg.dbPostgresSchema,
        })
      : Database.memory()
  await db.migrateToLatestOrThrow()

  const blobstore = new MemoryBlobStore()

  const pds = PDS.create({
    db,
    blobstore,
    repoSigningKey,
    plcRotationKey,
    config: cfg,
  })
  const pdsServer = await pds.start()
  const pdsPort = (pdsServer.address() as AddressInfo).port
  const pdsUrl = `http://localhost:${pdsPort}`

  return {
    pdsUrl,
    mocker: new Mocker(pdsUrl),
    async close() {
      await pds.destroy()
      await plcServer.destroy()
    },
  }
}

class Mocker {
  agent: BskyAgent
  users: Record<string, TestUser> = {}

  constructor(public service: string) {
    this.agent = new BskyAgent({service})
  }

  // NOTE
  // deterministic date generator
  // we use this to ensure the mock dataset is always the same
  // which is very useful when testing
  *dateGen() {
    let start = 1657846031914
    while (true) {
      yield new Date(start).toISOString()
      start += 1e3
    }
  }

  async createUser(name: string) {
    const agent = new BskyAgent({service: this.agent.service})
    const email = `fake${Object.keys(this.users).length + 1}@fake.com`
    const res = await agent.createAccount({
      email,
      handle: name + '.test',
      password: 'hunter2',
    })
    this.users[name] = {
      did: res.data.did,
      email,
      handle: name + '.test',
      password: 'hunter2',
      agent: agent,
    }
  }

  async follow(a: string, b: string) {
    await this.users[a].agent.follow(this.users[b].did)
  }

  async generateStandardMock() {
    await this.createUser('alice')
    await this.createUser('bob')
    await this.createUser('carla')

    await this.users.alice.agent.upsertProfile(() => ({
      displayName: 'Alice',
      description: 'Test user 1',
    }))

    await this.users.bob.agent.upsertProfile(() => ({
      displayName: 'Bob',
      description: 'Test user 2',
    }))

    await this.users.carla.agent.upsertProfile(() => ({
      displayName: 'Carla',
      description: 'Test user 3',
    }))

    await this.follow('alice', 'bob')
    await this.follow('alice', 'carla')
    await this.follow('bob', 'alice')
    await this.follow('bob', 'carla')
    await this.follow('carla', 'alice')
    await this.follow('carla', 'bob')
  }
}
