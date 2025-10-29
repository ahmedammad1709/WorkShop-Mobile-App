/** @param {import('knex').Knex} knex */
export async function up(knex) {
  const exists = await knex.schema.hasTable('otp_verifications');
  if (exists) return;
  await knex.schema.createTable('otp_verifications', (table) => {
    table.increments('id').primary();
    table.string('email').notNullable().index();
    table.string('otp_hash').notNullable();
    table.dateTime('expires_at').notNullable().index();
    table.integer('attempts').defaultTo(0);
    table.boolean('used').defaultTo(false);
    table.timestamps(true, true);
  });
}

/** @param {import('knex').Knex} knex */
export async function down(knex) {
  await knex.schema.dropTableIfExists('otp_verifications');
}


