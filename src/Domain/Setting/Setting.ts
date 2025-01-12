import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { User } from '../User/User'

@Entity({ name: 'settings' })
@Index('index_settings_on_name_and_user_uuid', ['name', 'user'])
export class Setting {
  static readonly DEFAULT_ENCRYPTION_VERSION = 0

  @PrimaryGeneratedColumn('uuid')
  uuid: string

  @Column({
    length: 255,
  })
  name: string

  @Column({
    length: 255,
  })
  value: string

  @Column({
    name: 'server_encryption_version',
    type: 'tinyint',
    default: Setting.DEFAULT_ENCRYPTION_VERSION,
  })
  serverEncryptionVersion: number

  @Column({
    name: 'created_at',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date

  @Column({
    name: 'updated_at',
    type: 'datetime',
    default:
      /* istanbul ignore next */
      () => 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date

  @ManyToOne(
    /* istanbul ignore next */
    () => User,
    /* istanbul ignore next */
    user => user.settings,
    /* istanbul ignore next */
    { onDelete: 'CASCADE', nullable: false }
  )
  @JoinColumn({ name: 'user_uuid', referencedColumnName: 'uuid' })
  user: Promise<User>
}
