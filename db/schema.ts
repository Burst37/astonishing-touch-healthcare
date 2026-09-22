import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const inquiries=sqliteTable('inquiries',{id:text('id').primaryKey(),name:text('name').notNull(),phone:text('phone').notNull(),email:text('email'),service:text('service').notNull(),consent:integer('consent',{mode:'boolean'}).notNull(),createdAt:integer('created_at').notNull()});

export const rateLimits=sqliteTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:integer('expires_at').notNull()});
