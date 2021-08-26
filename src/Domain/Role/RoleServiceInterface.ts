import { SubscriptionName } from '@standardnotes/auth'
import { User } from '../User/User'

export interface RoleServiceInterface {
  addUserRole(user: User, subscriptionName: SubscriptionName): Promise<void>
  removeUserRole(user: User, subscriptionName: SubscriptionName): Promise<void>
}