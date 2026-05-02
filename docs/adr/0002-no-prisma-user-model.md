# No Prisma User model — Supabase UUIDs stored as plain strings

We use Supabase for auth and store the Supabase user UUID directly as a plain `String` field (`userId`) on Task and EnergySnapshot, rather than creating a Prisma `User` model. Maintaining a shadow User table that mirrors Supabase auth adds a sync surface (webhook or trigger to keep them in sync) with no benefit for this app — we never query users as first-class entities, only filter by `userId`. If user profile data is needed in V2, a User model can be added then.
