import dayjs = require('dayjs')
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { User } from '../User/User'
import { Setting } from './Setting'
import { SettingProps } from './SettingProps'
import { v4 as uuidv4 } from 'uuid'
import { CrypterInterface } from '../Encryption/CrypterInterface'

@injectable()
export class SettingFactory {
  constructor(
    @inject(TYPES.Crypter) private crypter: CrypterInterface,
  ) {}

  async create(props: SettingProps, user: User): Promise<Setting> {
    const uuid = props.uuid ?? uuidv4()

    const {
      name,
      value,
      serverEncryptionVersion = Setting.ENCRYPTION_VERSION_DEFAULT,
    } = props

    const setting: Setting = {
      uuid,
      user: (async () => user)(),
      name,
      value: await this.createValue({
        value,
        serverEncryptionVersion,
        user,
      }),
      serverEncryptionVersion,
      createdAt: dayjs.utc().toDate(),
      updatedAt: dayjs.utc().toDate(),
    }

    return Object.assign(new Setting(), setting)
  }

  async createReplacement(
    original: Setting,
    props: SettingProps,
  ): Promise<Setting> {
    const { uuid, user } = original

    return Object.assign(this.create(props, await user), {
      uuid,
    })
  }

  async createValue({
    value,
    serverEncryptionVersion,
    user,
  }: {
    value: string,
    serverEncryptionVersion: number,
    user: User
  }): Promise<string> {
    if (serverEncryptionVersion === Setting.ENCRYPTION_VERSION_UNENCRYPTED) {
      return value
    }
    if (serverEncryptionVersion === Setting.ENCRYPTION_VERSION_DEFAULT) {
      return this.crypter.encryptForUser(value, user)
    }
    throw Error(`Unrecognized encryption version: ${serverEncryptionVersion}!`)
  }
}
