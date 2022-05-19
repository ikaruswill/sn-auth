import { AnalyticsEntity } from './AnalyticsEntity'

export interface AnalyticsEntityRepositoryInterface {
  save(analyticsEntity: AnalyticsEntity): Promise<AnalyticsEntity>
}
