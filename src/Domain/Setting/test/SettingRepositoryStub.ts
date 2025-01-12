import { DeleteSettingDto } from '../../UseCase/DeleteSetting/DeleteSettingDto'
import { Setting } from '../Setting'
import { SettingRepositoryInterface } from '../SettingRepositoryInterface'

export class SettingRepostioryStub implements SettingRepositoryInterface {
  constructor(
    private settings: Setting[],
  ) {}
  async findOneByNameAndUserUuid(name: string, userUuid: string): Promise<Setting | undefined> {
    for (const setting of this.settings) {
      if (setting.name === name && (await setting.user).uuid === userUuid) {
        return setting
      }
    }

    return undefined
  }
  async findAllByUserUuid(userUuid: string): Promise<Setting[]> {
    const found = []
    for (const setting of this.settings) {
      if ((await setting.user).uuid === userUuid) {
        found.push(setting)
      }
    }

    return found
  }
  /**
   * Note: this doesn't really delete anything, just pretends it did.
   */
  async deleteByUserUuid({
    settingName,
    userUuid,
  }: DeleteSettingDto): Promise<void> {
    const index = await findIndex(this.settings, async (s: Setting) => {
      return s.name === settingName && (await s.user).uuid === userUuid
    })

    if (index === -1) {
      throw Error('Expected deleteByUserUuid to always succeed.')
    }
  }
  /**
   * Note: this doesn't really save anything, just pretends it did.
   */
  async save(setting: Setting): Promise<Setting> {
    return setting
  }
}

async function findIndex<T>(
  list: T[],
  predicate: (item: T) => Promise<boolean>,
): Promise<number> {
  for (let i = 0; i < list.length; ++i) {
    const item = list[i]
    if (await predicate(item)) {
      return i
    }
  }
  return -1
}
