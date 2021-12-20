import { injectable } from 'inversify'
import { EntityRepository, Repository } from 'typeorm'
import { OfflineUserSubscription } from '../../Domain/Subscription/OfflineUserSubscription'
import { OfflineUserSubscriptionRepositoryInterface } from '../../Domain/Subscription/OfflineUserSubscriptionRepositoryInterface'

@injectable()
@EntityRepository(OfflineUserSubscription)
export class MySQLOfflineUserSubscriptionRepository extends Repository<OfflineUserSubscription> implements OfflineUserSubscriptionRepositoryInterface {
  async findByEmail(email: string, activeAfter: number): Promise<OfflineUserSubscription[]> {
    return await this.createQueryBuilder('offline_user_subscription')
      .where(
        'offline_user_subscription.email = :email AND offline_user_subscription.ends_at > :endsAt',
        {
          email,
          endsAt: activeAfter,
        }
      )
      .orderBy('offline_user_subscription.ends_at', 'DESC')
      .getMany()
  }

  async findOneByEmail(email: string): Promise<OfflineUserSubscription | undefined> {
    const subscriptions = await this.createQueryBuilder('offline_user_subscription')
      .where(
        'offline_user_subscription.email = :email',
        {
          email,
        }
      )
      .orderBy('offline_user_subscription.ends_at', 'DESC')
      .getMany()

    /* istanbul ignore next */
    console.log(`Found ${subscriptions.length} offline user subscriptions`)

    const uncanceled = subscriptions.find((subscription) => !subscription.cancelled)

    /* istanbul ignore next */
    console.log(`Uncanceled subscription: ${uncanceled}`)

    return uncanceled || subscriptions[0]
  }

  async updateCancelled(subscriptionId: number, cancelled: boolean, updatedAt: number): Promise<void> {
    await this.createQueryBuilder('offline_user_subscription')
      .update()
      .set({
        cancelled,
        updatedAt,
      })
      .where(
        'offline_user_subscription.subscription_id = :subscriptionId',
        {
          subscriptionId,
        }
      )
      .execute()
  }

  async updateEndsAt(subscriptionId: number, endsAt: number, updatedAt: number): Promise<void> {
    await this.createQueryBuilder('offline_user_subscription')
      .update()
      .set({
        endsAt,
        updatedAt,
      })
      .where(
        'offline_user_subscription.subscription_id = :subscriptionId',
        {
          subscriptionId,
        }
      )
      .execute()
  }
}
