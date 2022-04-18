import 'reflect-metadata'

import { SelectQueryBuilder } from 'typeorm'

import { MySQLSharedSubscriptionInvitationRepository } from './MySQLSharedSubscriptionInvitationRepository'
import { SharedSubscriptionInvitation } from '../../Domain/SharedSubscription/SharedSubscriptionInvitation'
import { InvitationStatus } from '../../Domain/SharedSubscription/InvitationStatus'

describe('MySQLSharedSubscriptionInvitationRepository', () => {
  let repository: MySQLSharedSubscriptionInvitationRepository
  let queryBuilder: SelectQueryBuilder<SharedSubscriptionInvitation>
  let invitation: SharedSubscriptionInvitation

  const makeSubject = () => {
    return new MySQLSharedSubscriptionInvitationRepository()
  }

  beforeEach(() => {
    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<SharedSubscriptionInvitation>>

    invitation = {} as jest.Mocked<SharedSubscriptionInvitation>

    repository = makeSubject()
    jest.spyOn(repository, 'createQueryBuilder')
    repository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should get invitations by inviter email', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getMany = jest.fn().mockReturnValue([])

    const result = await repository.findByInviterEmail('test@test.te')

    expect(queryBuilder.where).toHaveBeenCalledWith('invitation.inviter_identifier = :inviterEmail', { inviterEmail: 'test@test.te' })

    expect(result).toEqual([])
  })

  it('should count invitations by inviter email and statuses', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getCount = jest.fn().mockReturnValue(3)

    const result = await repository.countByInviterEmailAndStatus('test@test.te', [InvitationStatus.Sent])

    expect(queryBuilder.where).toHaveBeenCalledWith('invitation.inviter_identifier = :inviterEmail AND invitation.status IN (:...statuses)', { inviterEmail: 'test@test.te', statuses: ['sent'] })

    expect(result).toEqual(3)
  })

  it('should find one invitation by name and uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(invitation)

    const result = await repository.findOneByUuidAndStatus('1-2-3', InvitationStatus.Sent)

    expect(queryBuilder.where).toHaveBeenCalledWith('invitation.uuid = :uuid AND invitation.status = :status', { uuid: '1-2-3', status: 'sent' })

    expect(result).toEqual(invitation)
  })

  it('should find one invitation by uuid', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(invitation)

    const result = await repository.findOneByUuid('1-2-3')

    expect(queryBuilder.where).toHaveBeenCalledWith('invitation.uuid = :uuid', { uuid: '1-2-3' })

    expect(result).toEqual(invitation)
  })
})
