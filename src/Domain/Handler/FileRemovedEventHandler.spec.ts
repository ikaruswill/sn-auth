import 'reflect-metadata'

import { FileRemovedEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import { User } from '../User/User'
import { FileRemovedEventHandler } from './FileRemovedEventHandler'
import { SubscriptionSettingServiceInterface } from '../Setting/SubscriptionSettingServiceInterface'
import { UserSubscription } from '../Subscription/UserSubscription'
import { UserSubscriptionType } from '../Subscription/UserSubscriptionType'
import { UserSubscriptionServiceInterface } from '../Subscription/UserSubscriptionServiceInterface'

describe('FileRemovedEventHandler', () => {
  let userSubscriptionService: UserSubscriptionServiceInterface
  let logger: Logger
  let user: User
  let event: FileRemovedEvent
  let subscriptionSettingService: SubscriptionSettingServiceInterface
  let regularSubscription: UserSubscription
  let sharedSubscription: UserSubscription

  const createHandler = () => new FileRemovedEventHandler(userSubscriptionService, subscriptionSettingService, logger)

  beforeEach(() => {
    user = {
      uuid: '123',
    } as jest.Mocked<User>

    regularSubscription = {
      uuid: '1-2-3',
      subscriptionType: UserSubscriptionType.Regular,
      user: Promise.resolve(user),
    } as jest.Mocked<UserSubscription>

    sharedSubscription = {
      uuid: '2-3-4',
      subscriptionType: UserSubscriptionType.Shared,
      user: Promise.resolve(user),
    } as jest.Mocked<UserSubscription>

    userSubscriptionService = {} as jest.Mocked<UserSubscriptionServiceInterface>
    userSubscriptionService.findRegularSubscriptionForUserUuid = jest
      .fn()
      .mockReturnValue({ regularSubscription, sharedSubscription: undefined })

    subscriptionSettingService = {} as jest.Mocked<SubscriptionSettingServiceInterface>
    subscriptionSettingService.findSubscriptionSettingWithDecryptedValue = jest.fn().mockReturnValue(undefined)
    subscriptionSettingService.createOrReplace = jest.fn()

    event = {} as jest.Mocked<FileRemovedEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userUuid: '1-2-3',
      fileByteSize: 123,
      filePath: '1-2-3/2-3-4',
      fileName: '2-3-4',
      regularSubscriptionUuid: '4-5-6',
    }

    logger = {} as jest.Mocked<Logger>
    logger.warn = jest.fn()
  })

  it('should do nothing a bytes used setting does not exist', async () => {
    await createHandler().handle(event)

    expect(subscriptionSettingService.createOrReplace).not.toHaveBeenCalled()
  })

  it('should not do anything if a user subscription is not found', async () => {
    subscriptionSettingService.findSubscriptionSettingWithDecryptedValue = jest.fn().mockReturnValue({
      value: 345,
    })
    userSubscriptionService.findRegularSubscriptionForUserUuid = jest
      .fn()
      .mockReturnValue({ regularSubscription: undefined, sharedSubscription: undefined })

    await createHandler().handle(event)

    expect(subscriptionSettingService.createOrReplace).not.toHaveBeenCalled()
  })

  it('should update a bytes used setting', async () => {
    subscriptionSettingService.findSubscriptionSettingWithDecryptedValue = jest.fn().mockReturnValue({
      value: 345,
    })
    await createHandler().handle(event)

    expect(subscriptionSettingService.createOrReplace).toHaveBeenCalledWith({
      props: {
        name: 'FILE_UPLOAD_BYTES_USED',
        sensitive: false,
        unencryptedValue: '222',
        serverEncryptionVersion: 0,
      },
      userSubscription: {
        uuid: '1-2-3',
        subscriptionType: 'regular',
        user: Promise.resolve(user),
      },
    })
  })

  it('should update a bytes used setting on both shared and regular subscription', async () => {
    userSubscriptionService.findRegularSubscriptionForUserUuid = jest
      .fn()
      .mockReturnValue({ regularSubscription, sharedSubscription })

    subscriptionSettingService.findSubscriptionSettingWithDecryptedValue = jest.fn().mockReturnValue({
      value: 345,
    })
    await createHandler().handle(event)

    expect(subscriptionSettingService.createOrReplace).toHaveBeenNthCalledWith(1, {
      props: {
        name: 'FILE_UPLOAD_BYTES_USED',
        sensitive: false,
        unencryptedValue: '222',
        serverEncryptionVersion: 0,
      },
      userSubscription: {
        uuid: '1-2-3',
        subscriptionType: 'regular',
        user: Promise.resolve(user),
      },
    })

    expect(subscriptionSettingService.createOrReplace).toHaveBeenNthCalledWith(2, {
      props: {
        name: 'FILE_UPLOAD_BYTES_USED',
        sensitive: false,
        unencryptedValue: '222',
        serverEncryptionVersion: 0,
      },
      userSubscription: {
        uuid: '2-3-4',
        subscriptionType: 'shared',
        user: Promise.resolve(user),
      },
    })
  })
})
