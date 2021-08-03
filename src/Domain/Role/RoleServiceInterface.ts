import { SubscriptionName } from '@standardnotes/auth'
import { User } from '../User/User'

export interface RoleServiceInterface {
  updateUserRole(user: User, fromSubscriptionName?: SubscriptionName, toSubscriptionName?: SubscriptionName): Promise<void>
}
