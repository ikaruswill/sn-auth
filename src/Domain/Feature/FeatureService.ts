import { SubscriptionName } from '@standardnotes/auth'
import { FeatureDescription, Features } from '@standardnotes/features'
import { inject, injectable } from 'inversify'
import TYPES from '../../Bootstrap/Types'
import { RoleToSubscriptionMapInterface } from '../Role/RoleToSubscriptionMapInterface'

import { User } from '../User/User'
import { UserSubscription } from '../Subscription/UserSubscription'
import { FeatureServiceInterface } from './FeatureServiceInterface'
import { OfflineUserSubscriptionRepositoryInterface } from '../Subscription/OfflineUserSubscriptionRepositoryInterface'
import { Role } from '../Role/Role'
import { OfflineUserSubscription } from '../Subscription/OfflineUserSubscription'
import { TimerInterface } from '@standardnotes/time'

@injectable()
export class FeatureService implements FeatureServiceInterface {
  constructor(
    @inject(TYPES.RoleToSubscriptionMap) private roleToSubscriptionMap: RoleToSubscriptionMapInterface,
    @inject(TYPES.OfflineUserSubscriptionRepository) private offlineUserSubscriptionRepository: OfflineUserSubscriptionRepositoryInterface,
    @inject(TYPES.Timer) private timer: TimerInterface,
  ) {
  }

  async getFeaturesForOfflineUser(email: string): Promise<FeatureDescription[]> {
    const userSubscriptions = await this.offlineUserSubscriptionRepository.findByEmail(email, this.timer.getTimestampInMicroseconds())
    const userRolesMap: Map<string, Role> = new Map()
    for (const userSubscription of userSubscriptions) {
      const subscriptionRoles = await userSubscription.roles
      for (const subscriptionRole of subscriptionRoles) {
        userRolesMap.set(subscriptionRole.name, subscriptionRole)
      }
    }

    return this.getFeaturesForSubscriptions(userSubscriptions, [...userRolesMap.values()])
  }

  async getFeaturesForUser(user: User): Promise<Array<FeatureDescription>> {
    const userSubscriptions = await user.subscriptions

    return this.getFeaturesForSubscriptions(userSubscriptions, await user.roles)
  }

  private async getFeaturesForSubscriptions(
    userSubscriptions: Array<UserSubscription | OfflineUserSubscription>,
    userRoles: Array<Role>,
  ): Promise<Array<FeatureDescription>> {
    const userFeatures: Map<string, FeatureDescription> = new Map()
    const userSubscriptionNames: Array<SubscriptionName> = []

    userSubscriptions.map((userSubscription: UserSubscription) => {
      const subscriptionName = userSubscription.planName as SubscriptionName
      if (!userSubscriptionNames.includes(subscriptionName)) {
        userSubscriptionNames.push(subscriptionName)
      }
    })

    for (const userSubscriptionName of userSubscriptionNames) {
      const roleName = this.roleToSubscriptionMap.getRoleNameForSubscriptionName(userSubscriptionName)
      if (roleName === undefined) {
        continue
      }
      const role = userRoles.find((role: Role) => role.name === roleName)
      if (role === undefined) {
        continue
      }

      const longestLastingSubscription = this.getLongestLastingSubscription(userSubscriptions, userSubscriptionName)

      const rolePermissions = await role.permissions

      for (const rolePermission of rolePermissions) {
        const featureForPermission = Features.find(feature => feature.permission_name === rolePermission.name) as FeatureDescription
        if (featureForPermission === undefined) {
          continue
        }

        const alreadyAddedFeature = userFeatures.get(rolePermission.name)
        if (alreadyAddedFeature === undefined) {
          userFeatures.set(rolePermission.name, {
            ...featureForPermission,
            expires_at: longestLastingSubscription.endsAt,
            role_name: roleName,
          })

          continue
        }

        if (longestLastingSubscription.endsAt > (alreadyAddedFeature.expires_at as number)) {
          alreadyAddedFeature.expires_at = longestLastingSubscription.endsAt
        }
      }
    }

    return [...userFeatures.values()]
  }

  private getLongestLastingSubscription(userSubscriptions: Array<UserSubscription | OfflineUserSubscription>, subscriptionName?: SubscriptionName) {
    return userSubscriptions
      .filter(subscription => subscription.planName === subscriptionName)
      .sort((a, b) => {
        if (a.endsAt < b.endsAt) { return 1 }
        if (a.endsAt > b.endsAt) { return -1 }
        return 0
      })[0]
  }
}
