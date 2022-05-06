import { Uuid } from '@standardnotes/common'
import { inject, injectable } from 'inversify'
import { Repository } from 'typeorm'
import TYPES from '../../Bootstrap/Types'

import { UserSubscription } from '../../Domain/Subscription/UserSubscription'
import { UserSubscriptionRepositoryInterface } from '../../Domain/Subscription/UserSubscriptionRepositoryInterface'
import { UserSubscriptionType } from '../../Domain/Subscription/UserSubscriptionType'

@injectable()
export class MySQLUserSubscriptionRepository implements UserSubscriptionRepositoryInterface {
  constructor(
    @inject(TYPES.ORMUserSubscriptionRepository)
    private ormRepository: Repository<UserSubscription>,
  ) {}

  async save(subscription: UserSubscription): Promise<UserSubscription> {
    return this.ormRepository.save(subscription)
  }

  async findOneByUserUuidAndSubscriptionId(userUuid: Uuid, subscriptionId: number): Promise<UserSubscription | null> {
    return await this.ormRepository
      .createQueryBuilder()
      .where('user_uuid = :userUuid AND subscription_id = :subscriptionId', {
        userUuid,
        subscriptionId,
      })
      .getOne()
  }

  async findBySubscriptionIdAndType(subscriptionId: number, type: UserSubscriptionType): Promise<UserSubscription[]> {
    return await this.ormRepository
      .createQueryBuilder()
      .where('subscription_id = :subscriptionId AND subscription_type = :type', {
        subscriptionId,
        type,
      })
      .getMany()
  }

  async findBySubscriptionId(subscriptionId: number): Promise<UserSubscription[]> {
    return await this.ormRepository
      .createQueryBuilder()
      .where('subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .getMany()
  }

  async findOneByUuid(uuid: Uuid): Promise<UserSubscription | null> {
    return await this.ormRepository
      .createQueryBuilder()
      .where('uuid = :uuid', {
        uuid,
      })
      .getOne()
  }

  async findOneByUserUuid(userUuid: Uuid): Promise<UserSubscription | null> {
    const subscriptions = await this.ormRepository
      .createQueryBuilder()
      .where('user_uuid = :user_uuid', {
        user_uuid: userUuid,
      })
      .orderBy('ends_at', 'DESC')
      .getMany()

    const uncanceled = subscriptions.find((subscription) => !subscription.cancelled)

    return uncanceled || subscriptions[0]
  }

  async updateEndsAt(subscriptionId: number, endsAt: number, updatedAt: number): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update()
      .set({
        endsAt,
        updatedAt,
      })
      .where('subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .execute()
  }

  async updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void> {
    await this.ormRepository
      .createQueryBuilder()
      .update()
      .set({
        cancelled,
        updatedAt,
      })
      .where('subscription_id = :subscriptionId', {
        subscriptionId,
      })
      .execute()
  }
}
