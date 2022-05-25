import 'reflect-metadata'

import { Repository, SelectQueryBuilder } from 'typeorm'

import { AnalyticsEntity } from '../../Domain/Analytics/AnalyticsEntity'

import { MySQLAnalyticsEntityRepository } from './MySQLAnalyticsEntityRepository'

describe('MySQLAnalyticsEntityRepository', () => {
  let ormRepository: Repository<AnalyticsEntity>
  let analyticsEntity: AnalyticsEntity
  let queryBuilder: SelectQueryBuilder<AnalyticsEntity>

  const createRepository = () => new MySQLAnalyticsEntityRepository(ormRepository)

  beforeEach(() => {
    analyticsEntity = {} as jest.Mocked<AnalyticsEntity>

    queryBuilder = {} as jest.Mocked<SelectQueryBuilder<AnalyticsEntity>>
    queryBuilder.cache = jest.fn().mockReturnThis()

    ormRepository = {} as jest.Mocked<Repository<AnalyticsEntity>>
    ormRepository.save = jest.fn()
    ormRepository.createQueryBuilder = jest.fn().mockImplementation(() => queryBuilder)
  })

  it('should save', async () => {
    await createRepository().save(analyticsEntity)

    expect(ormRepository.save).toHaveBeenCalledWith(analyticsEntity)
  })

  it('should find one by user uuid and cache it for an hour', async () => {
    queryBuilder.where = jest.fn().mockReturnThis()
    queryBuilder.getOne = jest.fn().mockReturnValue(analyticsEntity)

    const result = await createRepository().findOneByUserUuid('123')

    expect(queryBuilder.where).toHaveBeenCalledWith('analytics_entity.user_uuid = :userUuid', { userUuid: '123' })
    expect(queryBuilder.cache).toHaveBeenCalledWith('analytics_entity_user_123', 3_600_000)

    expect(result).toEqual(analyticsEntity)
  })
})
