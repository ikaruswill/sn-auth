import 'reflect-metadata'

import { DomainEventPublisherInterface, SharedSubscriptionInvitationCreatedEvent } from '@standardnotes/domain-events'
import { TimerInterface } from '@standardnotes/time'
import { DomainEventFactoryInterface } from '../../Event/DomainEventFactoryInterface'
import { SharedSubscriptionInvitationRepositoryInterface } from '../../SharedSubscription/SharedSubscriptionInvitationRepositoryInterface'

import { InviteToSharedSubscription } from './InviteToSharedSubscription'
import { UserSubscriptionRepositoryInterface } from '../../Subscription/UserSubscriptionRepositoryInterface'
import { UserSubscription } from '../../Subscription/UserSubscription'

describe('InviteToSharedSubscription', () => {
  let userSubscriptionRepository: UserSubscriptionRepositoryInterface
  let timer: TimerInterface
  let sharedSubscriptionInvitationRepository: SharedSubscriptionInvitationRepositoryInterface
  let domainEventPublisher: DomainEventPublisherInterface
  let domainEventFactory: DomainEventFactoryInterface

  const createUseCase = () => new InviteToSharedSubscription(
    userSubscriptionRepository,
    timer,
    sharedSubscriptionInvitationRepository,
    domainEventPublisher,
    domainEventFactory
  )

  beforeEach(() => {
    userSubscriptionRepository = {} as jest.Mocked<UserSubscriptionRepositoryInterface>
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue({ subscriptionId: 2 } as jest.Mocked<UserSubscription>)

    timer = {} as jest.Mocked<TimerInterface>
    timer.getTimestampInMicroseconds = jest.fn().mockReturnValue(1)

    sharedSubscriptionInvitationRepository = {} as jest.Mocked<SharedSubscriptionInvitationRepositoryInterface>
    sharedSubscriptionInvitationRepository.save = jest.fn().mockImplementation(same => ({ uuid: '1-2-3', ...same }))

    domainEventPublisher = {} as jest.Mocked<DomainEventPublisherInterface>
    domainEventPublisher.publish = jest.fn()

    domainEventFactory = {} as jest.Mocked<DomainEventFactoryInterface>
    domainEventFactory.createSharedSubscriptionInvitationCreatedEvent =
      jest.fn().mockReturnValue({} as jest.Mocked<SharedSubscriptionInvitationCreatedEvent>)
  })

  it('should not create an inivitation for sharing the subscription if inviter has no subscription', async () => {
    userSubscriptionRepository.findOneByUserUuid = jest.fn().mockReturnValue(undefined)

    await createUseCase().execute({
      inviteeIdentifier: 'invitee@test.te',
      inviterUuid: '1-2-3',
      inviterEmail: 'inviter@test.te',
    })

    expect(sharedSubscriptionInvitationRepository.save).not.toHaveBeenCalled()

    expect(domainEventFactory.createSharedSubscriptionInvitationCreatedEvent).not.toHaveBeenCalled()
    expect(domainEventPublisher.publish).not.toHaveBeenCalled()
  })

  it('should create an inivitation for sharing the subscription', async () => {
    await createUseCase().execute({
      inviteeIdentifier: 'invitee@test.te',
      inviterUuid: '1-2-3',
      inviterEmail: 'inviter@test.te',
    })

    expect(sharedSubscriptionInvitationRepository.save).toHaveBeenCalledWith({
      createdAt: 1,
      inviteeIdentifier: 'invitee@test.te',
      inviteeIdentifierType: 'email',
      inviterIdentifier: 'inviter@test.te',
      inviterIdentifierType: 'email',
      status: 'sent',
      subscriptionId: 2,
      updatedAt: 1,
    })

    expect(domainEventFactory.createSharedSubscriptionInvitationCreatedEvent).toHaveBeenCalledWith({
      inviteeIdentifier: 'invitee@test.te',
      inviteeIdentifierType: 'email',
      inviterEmail: 'inviter@test.te',
      inviterSubscriptionId: 2,
      sharedSubscriptionInvitationUuid: '1-2-3',
    })
    expect(domainEventPublisher.publish).toHaveBeenCalled()
  })

  it('should create an inivitation for sharing the subscription with a vault account', async () => {
    await createUseCase().execute({
      inviteeIdentifier: 'a75a31ce95365904ef0e0a8e6cefc1f5e99adfef81bbdb6d4499eeb10ae0ff67',
      inviterEmail: 'inviter@test.te',
      inviterUuid: '1-2-3',
    })

    expect(sharedSubscriptionInvitationRepository.save).toHaveBeenCalledWith({
      createdAt: 1,
      inviteeIdentifier: 'a75a31ce95365904ef0e0a8e6cefc1f5e99adfef81bbdb6d4499eeb10ae0ff67',
      inviteeIdentifierType: 'hash',
      inviterIdentifier: 'inviter@test.te',
      inviterIdentifierType: 'email',
      status: 'sent',
      subscriptionId: 2,
      updatedAt: 1,
    })

    expect(domainEventFactory.createSharedSubscriptionInvitationCreatedEvent).toHaveBeenCalledWith({
      inviteeIdentifier: 'a75a31ce95365904ef0e0a8e6cefc1f5e99adfef81bbdb6d4499eeb10ae0ff67',
      inviteeIdentifierType: 'hash',
      inviterEmail: 'inviter@test.te',
      inviterSubscriptionId: 2,
      sharedSubscriptionInvitationUuid: '1-2-3',
    })
    expect(domainEventPublisher.publish).toHaveBeenCalled()
  })
})
