import { relations, sql } from "drizzle-orm";
import { boolean, decimal, foreignKey, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { InstallationStatus, PassStatus, PaymentStatus, StudentStatus, TagType } from "pases-universitarios";

export const paymentStatusEnum = pgEnum('payment_status', PaymentStatus);
export const studentStatusEnum = pgEnum('student_status', StudentStatus);
export const passStatusEnum = pgEnum('pass_status', PassStatus);
export const installationStatusEnum = pgEnum('installation_status', InstallationStatus);
export const tagTypeEnum = pgEnum('tag_type', TagType);

export const config = pgTable('config', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    googleWalletClassId: text('google_wallet_class_id').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const universities = pgTable('universities', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const tags = pgTable('tags', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    universityId: uuid('university_id').references(() => universities.id).notNull(),
    name: text('name').notNull(),
    type: tagTypeEnum('type').notNull(),
    description: text('description').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const careers = pgTable('careers', {
    code: text('code').notNull(),
    universityId: uuid('university_id').references(() => universities.id).notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.code, t.universityId] }),
]);

export const passes = pgTable('passes', {
    uniqueIdentifier: text('unique_identifier').notNull(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    universityId: uuid('university_id').references(() => universities.id).notNull(),
    careerId: text('career_id').notNull(),
    semester: integer('semester').notNull(),
    enrollmentYear: integer('enrollment_year').notNull(),
    paymentReference: text('payment_reference').notNull(),
    paymentStatus: paymentStatusEnum('payment_status').notNull(),
    passStatus: passStatusEnum('pass_status').notNull(),
    totalToPay: decimal('total_to_pay').notNull(),
    startDueDate: timestamp('start_due_date', { withTimezone: true }).notNull(),
    endDueDate: timestamp('end_due_date', { withTimezone: true }).notNull(),
    cashback: decimal('cashback').notNull(),
    studentStatus: studentStatusEnum('student_status').notNull(),
    onlinePaymentUrl: text('online_payment_url'),
    academicCalendarUrl: text('academic_calendar_url'),
    googleWalletObjectId: text('google_wallet_object_id'),
    appleWalletSerialNumber: text('apple_wallet_serial_number'),
    googleInstallationStatus: installationStatusEnum('google_installation_status').notNull().default(InstallationStatus.Pending),
    appleInstallationStatus: installationStatusEnum('apple_installation_status').notNull().default(InstallationStatus.Pending),
    notificationCount: integer('notification_count').notNull().default(0),
    lastNotificationDate: timestamp('last_notification_date', { withTimezone: true }),
    informationField: text('information_field').notNull().default(''),
    photo1Url: text('photo1_url').notNull(),
    photo2Url: text('photo2_url').notNull(),
    photo3Url: text('photo3_url').notNull(),
    photoGoogleHeroUrl: text('photo_google_hero_url').notNull(),
    qrCodeUrl: text('qr_code_url').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.uniqueIdentifier, t.careerId, t.universityId] }),
    unique('uq_passes').on(t.uniqueIdentifier, t.careerId, t.universityId),
    foreignKey({
        columns: [t.careerId, t.universityId],
        foreignColumns: [careers.code, careers.universityId],
    }),
    index('idx_passes_unique_identifier').on(t.uniqueIdentifier),
    
    // Status filters (very common in dashboards)
    index('idx_passes_payment_status').on(t.paymentStatus),
    index('idx_passes_pass_status').on(t.passStatus),
    
    // Foreign key for joins and filtering by career
    index('idx_passes_career_id').on(t.careerId),
    
    // Composite indexes for common filter combinations
    index('idx_passes_career_payment').on(t.careerId, t.paymentStatus),
    index('idx_passes_status_dates').on(t.passStatus, t.startDueDate, t.endDueDate),
    index('idx_passes_career_year_semester').on(t.careerId, t.enrollmentYear, t.semester),
    
    // Date range queries
    index('idx_passes_start_due_date').on(t.startDueDate),
    index('idx_passes_end_due_date').on(t.endDueDate),
    
    // Temporal sorting/filtering
    index('idx_passes_created_at').on(t.createdAt),
    
    index('idx_passes_google_wallet_object_id').on(t.googleWalletObjectId),
    index('idx_passes_apple_wallet_serial_number').on(t.appleWalletSerialNumber),
]);

// This is a temporary table to store the updates of the passes
export const passUpdates = pgTable('pass_updates', {
    uniqueIdentifier: text('unique_identifier').notNull(),
    careerId: text('career_id').notNull(),
    universityId: uuid('university_id').notNull(),
    totalToPay: decimal('total_to_pay').notNull(),
    cashback: decimal('cashback').notNull(),
    endDueDate: timestamp('end_due_date', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.uniqueIdentifier, t.careerId, t.universityId] }),
    foreignKey({
        columns: [t.uniqueIdentifier, t.careerId, t.universityId],
        foreignColumns: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
]);


export const appleDevices = pgTable('apple_devices', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    uniqueIdentifier: text('unique_identifier').notNull(),
    careerId: text('career_id').notNull(),
    universityId: uuid('university_id').notNull(),
    deviceLibraryIdentifier: text('device_library_identifier').notNull(),
    passTypeIdentifier: text('pass_type_identifier').notNull(),
    pushToken: text('push_token').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    unique('uq_apple_devices').on(t.uniqueIdentifier, t.careerId, t.universityId, t.deviceLibraryIdentifier, t.passTypeIdentifier, t.pushToken),
    foreignKey({
        columns: [t.uniqueIdentifier, t.careerId, t.universityId],
        foreignColumns: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
    index('idx_apple_devices_unique_identifier').on(t.uniqueIdentifier),
    index('idx_apple_devices_career_id').on(t.careerId),
    index('idx_apple_devices_university_id').on(t.universityId),
    index('idx_apple_devices_device_library_identifier').on(t.deviceLibraryIdentifier),
    index('idx_apple_devices_pass_type_identifier').on(t.passTypeIdentifier),
    index('idx_apple_devices_push_token').on(t.pushToken),
]);

export const numericTags = pgTable('numeric_tags', {
    uniqueIdentifier: text('unique_identifier').notNull(),
    careerId: text('career_id').notNull(),
    universityId: uuid('university_id').notNull(),
    tagId: uuid('tag_id').references(() => tags.id).notNull(),
    value: decimal('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.uniqueIdentifier, t.careerId, t.universityId, t.tagId] }),
    foreignKey({
        columns: [t.uniqueIdentifier, t.careerId, t.universityId],
        foreignColumns: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    })
]);

export const dateTags = pgTable('date_tags', {
    uniqueIdentifier: text('unique_identifier').notNull(),
    careerId: text('career_id').notNull(),
    universityId: uuid('university_id').notNull(),
    tagId: uuid('tag_id').references(() => tags.id).notNull(),
    value: timestamp('value', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.uniqueIdentifier, t.careerId, t.universityId, t.tagId] }),
    foreignKey({
        columns: [t.uniqueIdentifier, t.careerId, t.universityId],
        foreignColumns: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    })
]);

export const booleanTags = pgTable('boolean_tags', {
    uniqueIdentifier: text('unique_identifier').notNull(),
    careerId: text('career_id').notNull(),
    universityId: uuid('university_id').notNull(),
    tagId: uuid('tag_id').references(() => tags.id).notNull(),
    value: boolean('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.uniqueIdentifier, t.careerId, t.universityId, t.tagId] }),
    foreignKey({
        columns: [t.uniqueIdentifier, t.careerId, t.universityId],
        foreignColumns: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    })
]);

export const listTagsOptions = pgTable('list_tags_options', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    tagId: uuid('tag_id').references(() => tags.id).notNull(),
    value: text('value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const listTags = pgTable('list_tags', {
    uniqueIdentifier: text('unique_identifier').notNull(),
    careerId: text('career_id').notNull(),
    universityId: uuid('university_id').notNull(),
    tagOptionId: uuid('tag_option_id').references(() => listTagsOptions.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
    primaryKey({ columns: [t.uniqueIdentifier, t.careerId, t.universityId, t.tagOptionId] }),
    foreignKey({
        columns: [t.uniqueIdentifier, t.careerId, t.universityId],
        foreignColumns: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
]);

// Relations

export const universitiesRelations = relations(universities, ({ many }) => ({
    careers: many(careers),
    passes: many(passes),
    tags: many(tags),
}));

export const careersRelations = relations(careers, ({ one, many }) => ({
    university: one(universities, {
        fields: [careers.universityId],
        references: [universities.id],
    }),
    passes: many(passes),
}));

export const passesRelations = relations(passes, ({ one, many }) => ({
    university: one(universities, {
        fields: [passes.universityId],
        references: [universities.id],
    }),
    career: one(careers, {
        fields: [passes.careerId, passes.universityId],
        references: [careers.code, careers.universityId],
    }),
    appleDevices: many(appleDevices),
    passUpdates: many(passUpdates),
    numericTags: many(numericTags),
    dateTags: many(dateTags),
    booleanTags: many(booleanTags),
    listTags: many(listTags),
}));

export const passUpdatesRelations = relations(passUpdates, ({ one }) => ({
    pass: one(passes, {
        fields: [passUpdates.uniqueIdentifier, passUpdates.careerId, passUpdates.universityId],
        references: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
}));

export const appleDevicesRelations = relations(appleDevices, ({ one }) => ({
    pass: one(passes, {
        fields: [appleDevices.uniqueIdentifier, appleDevices.careerId, appleDevices.universityId],
        references: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
    university: one(universities, {
        fields: [tags.universityId],
        references: [universities.id],
    }),
    numericTags: one(numericTags, {
        fields: [tags.id],
        references: [numericTags.tagId],
    }),
    dateTags: one(dateTags, {
        fields: [tags.id],
        references: [dateTags.tagId],
    }),
    booleanTags: one(booleanTags, {
        fields: [tags.id],
        references: [booleanTags.tagId],
    }),
    listTagsOptions: one(listTagsOptions, {
        fields: [tags.id],
        references: [listTagsOptions.tagId],
    }),
}));

export const numericTagsRelations = relations(numericTags, ({ one }) => ({
    pass: one(passes, {
        fields: [numericTags.uniqueIdentifier, numericTags.careerId, numericTags.universityId],
        references: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
    tag: one(tags, {
        fields: [numericTags.tagId],
        references: [tags.id],
    }),
}));

export const dateTagsRelations = relations(dateTags, ({ one }) => ({
    pass: one(passes, {
        fields: [dateTags.uniqueIdentifier, dateTags.careerId, dateTags.universityId],
        references: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
    tag: one(tags, {
        fields: [dateTags.tagId],
        references: [tags.id],
    }),
}));

export const booleanTagsRelations = relations(booleanTags, ({ one }) => ({
    pass: one(passes, {
        fields: [booleanTags.uniqueIdentifier, booleanTags.careerId, booleanTags.universityId],
        references: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
    tag: one(tags, {
        fields: [booleanTags.tagId],
        references: [tags.id],
    }),
}));

export const listTagsOptionsRelations = relations(listTagsOptions, ({ one, many }) => ({
    tag: one(tags, {
        fields: [listTagsOptions.tagId],
        references: [tags.id],
    }),
    listTags: many(listTags),
}));

export const listTagsRelations = relations(listTags, ({ one }) => ({
    pass: one(passes, {
        fields: [listTags.uniqueIdentifier, listTags.careerId, listTags.universityId],
        references: [passes.uniqueIdentifier, passes.careerId, passes.universityId],
    }),
    tag: one(tags, {
        fields: [listTags.tagOptionId],
        references: [tags.id],
    }),
    tagOption: one(listTagsOptions, {
        fields: [listTags.tagOptionId],
        references: [listTagsOptions.id],
    }),
}));