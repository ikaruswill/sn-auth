import 'reflect-metadata'

import * as express from 'express'

import { SettingsController } from './SettingsController'
import { results } from 'inversify-express-utils'
import { User } from '../Domain/User/User'
import { GetSettings } from '../Domain/UseCase/GetSettings/GetSettings'
import { GetSetting } from '../Domain/UseCase/GetSetting/GetSetting'
import { UpdateSetting } from '../Domain/UseCase/UpdateSetting/UpdateSetting'
import { DeleteSetting } from '../Domain/UseCase/DeleteSetting/DeleteSetting'
import { Setting } from '../Domain/Setting/Setting'

describe('SettingsController', () => {
  let deleteSetting: DeleteSetting
  let getSettings: GetSettings
  let getSetting: GetSetting
  let updateSetting: UpdateSetting

  let request: express.Request
  let response: express.Response
  let user: User

  const createController = () => new SettingsController(
    getSettings,
    getSetting,
    updateSetting,
    deleteSetting,
  )

  beforeEach(() => {
    deleteSetting = {} as jest.Mocked<DeleteSetting>
    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

    user = {} as jest.Mocked<User>
    user.uuid = '123'

    getSettings = {} as jest.Mocked<GetSettings>
    getSettings.execute = jest.fn()

    getSetting = {} as jest.Mocked<GetSetting>
    getSetting.execute = jest.fn()

    updateSetting = {} as jest.Mocked<UpdateSetting>
    updateSetting.execute = jest.fn()

    request = {
      headers: {},
      body: {},
      params: {},
    } as jest.Mocked<express.Request>

    response = {
      locals: {},
    } as jest.Mocked<express.Response>
  })

  it('should get user settings', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    const httpResponse = <results.JsonResult> await createController().getSettings(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).toHaveBeenCalledWith({ userUuid: '1-2-3' })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get user settings if not allowed', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '2-3-4',
    }

    const httpResponse = <results.JsonResult> await createController().getSettings(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should get user mfa setting', async () => {
    request.params.userUuid = '1-2-3'
    request.body.lastSyncTime = 123

    getSettings.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().getMFASettings(request)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', allowSensitiveRetrieval: true, updatedAfter: 123 })

    expect(result.statusCode).toEqual(200)
  })

  it('should fail if could not get user mfa setting', async () => {
    request.params.userUuid = '1-2-3'

    getSettings.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().getMFASettings(request)
    const result = await httpResponse.executeAsync()

    expect(getSettings.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', allowSensitiveRetrieval: true })

    expect(result.statusCode).toEqual(400)
  })

  it('should delete user mfa setting', async () => {
    request.params.userUuid = '1-2-3'

    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().deleteMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', softDelete: true })

    expect(result.statusCode).toEqual(200)
  })

  it('should fail if could not delete user mfa setting', async () => {
    request.params.userUuid = '1-2-3'

    deleteSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().deleteMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'MFA_SECRET', softDelete: true })

    expect(result.statusCode).toEqual(400)
  })

  it('should update user mfa setting with default encrypted setting', async () => {
    request.params.userUuid = '1-2-3'
    request.body = {
      uuid: '2-3-4',
      value: 'test',
      createdAt: 123,
      updatedAt: 234,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        createdAt: 123,
        name: 'MFA_SECRET',
        serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
        sensitive: true,
        updatedAt: 234,
        uuid: '2-3-4',
        value: 'test',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should update user mfa setting with different encryption', async () => {
    request.params.userUuid = '1-2-3'
    request.body = {
      uuid: '2-3-4',
      value: 'test',
      sensitive: true,
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
      createdAt: 123,
      updatedAt: 234,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        createdAt: 123,
        name: 'MFA_SECRET',
        serverEncryptionVersion: 1,
        updatedAt: 234,
        sensitive: true,
        uuid: '2-3-4',
        value: 'test',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should fail if could not update user mfa setting', async () => {
    request.params.userUuid = '1-2-3'
    request.body = {
      uuid: '2-3-4',
      value: 'test',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
      createdAt: 123,
      updatedAt: 234,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().updateMFASetting(request)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        createdAt: 123,
        name: 'MFA_SECRET',
        serverEncryptionVersion: 1,
        updatedAt: 234,
        uuid: '2-3-4',
        value: 'test',
        sensitive: true,
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(400)
  })

  it('should get user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'test'
    response.locals.user = {
      uuid: '1-2-3',
    }

    getSetting.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().getSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'test' })

    expect(result.statusCode).toEqual(200)
  })

  it('should not get user setting if not allowed', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'test'
    response.locals.user = {
      uuid: '2-3-4',
    }

    getSetting.execute = jest.fn()

    const httpResponse = <results.JsonResult> await createController().getSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSetting.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should fail if could not get user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'test'
    response.locals.user = {
      uuid: '1-2-3',
    }

    getSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().getSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(getSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'test' })

    expect(result.statusCode).toEqual(400)
  })

  it('should update user setting with default encryption', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        name: 'foo',
        sensitive: false,
        serverEncryptionVersion: 1,
        value: 'bar',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should update user setting with different encryption setting', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_UNENCRYPTED,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: true, statusCode: 200 })

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        name: 'foo',
        sensitive: false,
        serverEncryptionVersion: 0,
        value: 'bar',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(200)
  })

  it('should not update user setting if not allowed', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '2-3-4',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    }

    updateSetting.execute = jest.fn()

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should fail if could not update user setting', async () => {
    request.params.userUuid = '1-2-3'
    response.locals.user = {
      uuid: '1-2-3',
    }

    request.body = {
      name: 'foo',
      value: 'bar',
      serverEncryptionVersion: Setting.ENCRYPTION_VERSION_DEFAULT,
    }

    updateSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().updateSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(updateSetting.execute).toHaveBeenCalledWith({
      props: {
        name: 'foo',
        serverEncryptionVersion: 1,
        sensitive: false,
        value: 'bar',
      },
      userUuid: '1-2-3',
    })

    expect(result.statusCode).toEqual(400)
  })

  it('should delete user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'foo'
    response.locals.user = {
      uuid: '1-2-3',
    }

    deleteSetting.execute = jest.fn().mockReturnValue({ success: true })

    const httpResponse = <results.JsonResult> await createController().deleteSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'foo' })

    expect(result.statusCode).toEqual(200)
  })

  it('should not delete user setting if user is not allowed', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'foo'
    response.locals.user = {
      uuid: '2-3-4',
    }

    deleteSetting.execute = jest.fn()

    const httpResponse = <results.JsonResult> await createController().deleteSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).not.toHaveBeenCalled()

    expect(result.statusCode).toEqual(401)
  })

  it('should fail if could not delete user setting', async () => {
    request.params.userUuid = '1-2-3'
    request.params.settingName = 'foo'
    response.locals.user = {
      uuid: '1-2-3',
    }

    deleteSetting.execute = jest.fn().mockReturnValue({ success: false })

    const httpResponse = <results.JsonResult> await createController().deleteSetting(request, response)
    const result = await httpResponse.executeAsync()

    expect(deleteSetting.execute).toHaveBeenCalledWith({ userUuid: '1-2-3', settingName: 'foo' })

    expect(result.statusCode).toEqual(400)
  })
})