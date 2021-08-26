import 'reflect-metadata'

import { RoleName, SubscriptionName } from '@standardnotes/auth'
import { SubscriptionExpiredEvent } from '@standardnotes/domain-events'
import { Logger } from 'winston'

import * as dayjs from 'dayjs'

import { User } from '../User/User'
import { UserRepositoryInterface } from '../User/UserRepositoryInterface'
import { SubscriptionExpiredEventHandler } from './SubscriptionExpiredEventHandler'
import { UserSubscriptionRepositoryInterface } from '../User/UserSubscriptionRepositoryInterface'
import { RoleServiceInterface } from '../Role/RoleServiceInterface'

describe('SubscriptionExpiredEventHandler', () => {
  let userRepository: UserRepositoryInterface
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let roleService: RoleServiceInterface
  let logger: Logger
  let user: User
  let event: SubscriptionExpiredEvent
  let timestamp: number

  const createHandler = () => new SubscriptionExpiredEventHandler(
    userRepository,
    userSubscriptionRepository,
    roleService,
    logger
  )

  beforeEach(() => {
    user = {
      uuid: '123',
      email: 'test@test.com',
      roles: Promise.resolve([{
        name: RoleName.ProUser,
      }]),
    } as jest.Mocked<User>

    userRepository = {} as jest.Mocked<UserRepositoryInterface>
    userRepository.findOneByEmail = jest.fn().mockReturnValue(user)
    userRepository.save = jest.fn().mockReturnValue(user)

    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.updateEndsAtByNameAndUserUuid = jest.fn()  

    roleService = {} as jest.Mocked<RoleServiceInterface>
    roleService.removeUserRole = jest.fn()

    timestamp = dayjs.utc().valueOf()

    event = {} as jest.Mocked<SubscriptionExpiredEvent>
    event.createdAt = new Date(1)
    event.payload = {
      userEmail: 'test@test.com',
      subscriptionName: SubscriptionName.CorePlan,
      timestamp,
    }

    logger = {} as jest.Mocked<Logger>
    logger.info = jest.fn()
    logger.warn = jest.fn()
  })

  it('should update the user role', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(roleService.removeUserRole).toHaveBeenCalledWith(user, SubscriptionName.CorePlan)
  })

  it('should update subscription ends at', async () => {
    await createHandler().handle(event)

    expect(userRepository.findOneByEmail).toHaveBeenCalledWith('test@test.com')
    expect(
      userSubscriptionRepository.updateEndsAtByNameAndUserUuid
    ).toHaveBeenCalledWith(
      SubscriptionName.CorePlan,
      '123',
      timestamp,
      timestamp,
    )
  })

  it('should not do anything if no user is found for specified email', async () => {
    userRepository.findOneByEmail = jest.fn().mockReturnValue(undefined)

    await createHandler().handle(event)

    expect(roleService.removeUserRole).not.toHaveBeenCalled()
    expect(userSubscriptionRepository.updateEndsAtByNameAndUserUuid).not.toHaveBeenCalled()
  })
})