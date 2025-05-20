module.exports = {
    tables: [
        {
			name: 'resource',
            fields: {
                name: {
                    type: 'STRING',
                },
                title: {
                    type: 'STRING',
                },
                file_name: {
                    type: 'STRING',
                },
                path: {
                    type: 'STRING',
                },
                class_name: {
                    type: 'STRING',
                },
                ext: {
                    type: 'STRING',
                },
                type: {
                    type: 'STRING',
                },
                category: {
                    type: 'STRING',
                },
                content: {
                    type: 'BLOB',
                },
                sequence: {
                    type: 'INTEGER',
                },
                user_id: {
                    type: 'INTEGER',
                },
                group_id: {
                    type: 'INTEGER',
                },
            }
        },
        {
			name: 'channel',
			belongsToMany: [
				{table: 'user', props: {through: 'user_channel', as: 'users', foreignKey: 'channel_id', otherKey: 'user_id'}},
			],
            fields: {
                name: {
                    type: 'STRING',
                },
                socket: {
                    type: 'STRING',
                },
            }
        },
        {
            name: 'post',
            fields: {
                heading: {
                    type: 'STRING',
                },
                sub_heading: {
                    type: 'STRING',
                },
                caption: {
                    type: 'STRING',
                },
                media: {
                    type: 'STRING',
                },
                description: {
                    type: 'STRING',
                },
                type: {
                    type: 'STRING',
                },
                status: {
                    type: 'STRING',
                },
            }
        },
        {
			name: 'user',
			belongsToMany: [
				{table: 'channel', props: {through: 'user_channel', as: 'channels', foreignKey: 'user_id', otherKey: 'channel_id'}},
			],
            fields: {
                first_name: {
                    type: 'STRING',
                },
                last_name: {
                    type: 'STRING'
                },
                email: {
                    type: 'STRING'
                },
                password: {
                    type: 'STRING'
                },
                username: {
                    type: 'STRING'
                },
            }
		},
		{
			name: 'user_channel',
            fields: {
                channel_id: {
                    type: 'INTEGER',
                },
                user_id: {
                    type: 'INTEGER',
                },
			},
			config: {
				indexes: [
					{
						unique: true,
						fields: ['channel_id', 'user_id']
					}
				]
			}
        },
        {
			name: 'group',
            //hasMany: [
            //    {table: 'resource', props: {as: 'resources'}}
            //],
            fields: {
                name: {
                    type: 'STRING',
                },
                type: {
                    type: 'STRING',
                },
            }
        },
    ]
}