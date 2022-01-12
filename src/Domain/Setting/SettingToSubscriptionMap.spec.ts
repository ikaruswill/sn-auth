import 'reflect-metadata'

import { SubscriptionName } from '@standardnotes/auth'
import { SettingName } from '@standardnotes/settings'

import { SettingToSubscriptionMap } from './SettingToSubscriptionMap'
import { PermissionName } from '@standardnotes/features'
import { EncryptionVersion } from '../Encryption/EncryptionVersion'

describe('SettingToSubscriptionMap', () => {
  const createMap = () => new SettingToSubscriptionMap()

  it('should return default encryption version for a setting which enecryption version is not strictly defined', () => {
    expect(createMap().getEncryptionVersionForSetting(SettingName.MfaSecret)).toEqual(EncryptionVersion.Default)
  })

  it('should return a defined encryption version for a setting which enecryption version is strictly defined', () => {
    expect(createMap().getEncryptionVersionForSetting(SettingName.EmailBackupFrequency)).toEqual(EncryptionVersion.Unencrypted)
  })

  it('should return default sensitivity for a setting which sensitivity is not strictly defined', () => {
    expect(createMap().getSensitivityForSetting(SettingName.DropboxBackupToken)).toBeTruthy()
  })

  it('should return a defined sensitivity for a setting which sensitivity is strictly defined', () => {
    expect(createMap().getSensitivityForSetting(SettingName.DropboxBackupFrequency)).toBeFalsy()
  })

  it('should return the default set of setting values for a core subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.CorePlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return the default set of setting values for a plus subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.PlusPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return the default set of setting values for a pro subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName(SubscriptionName.ProPlan)

    expect(settings).not.toBeUndefined()

    const flatSettings = [...(settings as Map<SettingName, { value: string, sensitive: boolean, serverEncryptionVersion: number }>).keys()]
    expect(flatSettings).toEqual([])
  })

  it('should return undefined set of setting values for an undefined subscription', () => {
    const settings = createMap().getDefaultSettingsAndValuesForSubscriptionName('foobar' as SubscriptionName)

    expect(settings).toBeUndefined()
  })

  it('should return a permission name associated to a given setting', () => {
    expect(createMap().getPermissionAssociatedWithSetting(SettingName.EmailBackupFrequency)).toEqual(PermissionName.DailyEmailBackup)
  })

  it('should not return a permission name if not associated to a given setting', () => {
    expect(createMap().getPermissionAssociatedWithSetting(SettingName.ExtensionKey)).toBeUndefined()
  })
})
