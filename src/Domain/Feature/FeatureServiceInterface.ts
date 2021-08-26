import { Feature } from '@standardnotes/features'

import { User } from '../User/User'

export interface FeatureServiceInterface {
  getFeaturesForUser(user: User): Promise<Array<Feature>>
}