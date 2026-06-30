import { sql } from "drizzle-orm"
import { db, sqlClient } from "../src/db/client"

const statements = [
	sql`
		create table if not exists profiles (
			id uuid primary key references auth.users(id) on delete cascade,
			username varchar(50) not null unique,
			avatar_url varchar(500),
			bio text,
			role varchar(20) not null default 'user',
			points integer not null default 0,
			karma integer not null default 0,
			is_banned boolean not null default false,
			created_at timestamptz not null default now(),
			updated_at timestamptz,
			constraint profiles_role_check check (role in ('user', 'admin'))
		);
	`,
	sql`
		create table if not exists games (
			id serial primary key,
			name varchar(150) not null unique,
			slug varchar(150) not null unique,
			cover_url varchar(500),
			created_at timestamptz not null default now()
		);
	`,
	sql`
		create table if not exists challenges (
			id serial primary key,
			slug varchar(200) not null unique,
			title varchar(150) not null,
			description text not null,
			rules text not null,
			reward_points integer not null default 0,
			status varchar(20) not null default 'active',
			game_id integer not null references games(id) on delete restrict,
			creator_id uuid not null references profiles(id) on delete cascade,
			created_at timestamptz not null default now(),
			updated_at timestamptz,
			constraint challenges_status_check check (status in ('active', 'closed', 'removed'))
		);
	`,
	sql`
		create table if not exists subscriptions (
			id serial primary key,
			profile_id uuid not null references profiles(id) on delete cascade,
			challenge_id integer not null references challenges(id) on delete cascade,
			created_at timestamptz not null default now()
		);
	`,
	sql`
		create unique index if not exists subscriptions_profile_challenge_unique
		on subscriptions (profile_id, challenge_id);
	`,
	sql`
		create table if not exists participations (
			id serial primary key,
			profile_id uuid not null references profiles(id) on delete cascade,
			challenge_id integer not null references challenges(id) on delete cascade,
			video_url varchar(500) not null,
			screenshot_url varchar(500),
			description text,
			upvotes integer not null default 0,
			downvotes integer not null default 0,
			status varchar(20) not null default 'pending',
			created_at timestamptz not null default now(),
			updated_at timestamptz,
			constraint participations_status_check check (
				status in ('pending', 'validated', 'rejected', 'removed')
			)
		);
	`,
	sql`
		create table if not exists votes (
			id serial primary key,
			participation_id integer not null references participations(id) on delete cascade,
			profile_id uuid not null references profiles(id) on delete cascade,
			value smallint not null,
			created_at timestamptz not null default now(),
			constraint votes_value_check check (value in (1, -1))
		);
	`,
	sql`
		create unique index if not exists votes_participation_profile_unique
		on votes (participation_id, profile_id);
	`,
	sql`
		create table if not exists badges (
			id serial primary key,
			name varchar(100) not null unique,
			description text not null,
			icon_url varchar(500),
			created_at timestamptz not null default now()
		);
	`,
	sql`
		create table if not exists user_badges (
			id serial primary key,
			profile_id uuid not null references profiles(id) on delete cascade,
			badge_id integer not null references badges(id) on delete cascade,
			challenge_id integer references challenges(id) on delete cascade,
			awarded_at timestamptz not null default now()
		);
	`,
	sql`
		create unique index if not exists user_badges_context_unique
		on user_badges (profile_id, badge_id, challenge_id)
		where challenge_id is not null;
	`,
	sql`
		create unique index if not exists user_badges_global_unique
		on user_badges (profile_id, badge_id)
		where challenge_id is null;
	`,
	sql`
		create table if not exists reports (
			id serial primary key,
			reporter_id uuid not null references profiles(id) on delete cascade,
			target_type varchar(30) not null,
			target_id varchar(100) not null,
			reason varchar(100) not null,
			description text,
			status varchar(20) not null default 'open',
			moderator_id uuid references profiles(id) on delete set null,
			moderator_note text,
			resolved_at timestamptz,
			created_at timestamptz not null default now(),
			updated_at timestamptz,
			constraint reports_target_type_check check (
				target_type in ('user', 'challenge', 'participation', 'vote')
			),
			constraint reports_status_check check (
				status in ('open', 'reviewing', 'resolved', 'rejected')
			)
		);
	`,
]

const alterStatements = [
	sql`alter table games add column if not exists genre varchar(100);`,
	sql`alter table challenges add column if not exists difficulty varchar(20) constraint challenges_difficulty_check check (difficulty is null or difficulty in ('easy', 'medium', 'hard', 'extreme', 'insane'));`,
	sql`alter table challenges add column if not exists youtube_url varchar(500);`,
]

for (const statement of [...statements, ...alterStatements]) {
	await db.execute(statement)
}

await sqlClient.end()

console.info("Database schema is ready.")
