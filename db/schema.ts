import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
 id:text('id').primaryKey(), requestKey:text('request_key').notNull().unique(), payloadHash:text('payload_hash').notNull(),
 name:text('name').notNull(), email:text('email').notNull(), phone:text('phone').notNull(),
 location:text('location').notNull(), date:text('preferred_date').notNull(), guests:text('guest_count').notNull(),
 type:text('event_type').notNull(), message:text('message').notNull(), status:text('status').notNull().default('requested'),
 cancellationReason:text('cancellation_reason'), createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(),
}, t=>[index('idx_orders_created').on(t.createdAt)]);
export const activity = sqliteTable('activity', {
 id:integer('id').primaryKey({autoIncrement:true}), orderId:text('order_id').notNull().references(()=>orders.id),
 actor:text('actor').notNull(), action:text('action').notNull(), createdAt:text('created_at').notNull(),
}, t=>[index('idx_activity_order').on(t.orderId)]);
export const payments = sqliteTable('payments', {
 id:text('id').primaryKey(), orderId:text('order_id').notNull().references(()=>orders.id), provider:text('provider').notNull(),
 providerId:text('provider_id').notNull(), amount:integer('amount').notNull(), currency:text('currency').notNull(),
 mode:text('mode').notNull(), refundKey:text('refund_key'), refundId:text('refund_id'), refundStatus:text('refund_status').notNull().default('none'),
 refundStartedAt:text('refund_started_at'), createdAt:text('created_at').notNull(),
}, t=>[uniqueIndex('idx_payments_provider_id').on(t.provider,t.providerId), index('idx_payments_order').on(t.orderId)]);
