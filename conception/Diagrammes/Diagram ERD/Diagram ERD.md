```
Table users {
 id uuid [primary key]
 email varchar [not null, unique]
 encrypted_password varchar
 email_confirmed_at timestamp
 last_sign_in_at timestamp
 created_at timestamp [not null]
 updated_at timestamp
 Note: 'Géré par Supabase (auth.users) - ne pas créer manuellement'
}

Table profiles {
 id uuid [primary key]
 username varchar [not null, unique]
 avatar_url varchar
 bio text
 role varchar [not null, default: 'user']
 points int [not null, default: 0]
 karma int [not null, default: 0]
 is_banned boolean [not null, default: false]
 created_at timestamp [not null, default: `now()`]
 updated_at timestamp
}

Table games {
 id int [primary key, increment]
 name varchar [not null, unique]
 slug varchar [not null, unique]
 cover_url varchar
 created_at timestamp [not null, default: `now()`]
}

Table challenges {
 id int [primary key, increment]
 slug varchar [not null, unique]
 title varchar [not null]
 description text [not null]
 rules text [not null]
 reward_points int [not null, default: 0]
 status varchar [not null, default: 'active']
 game_id int [not null]
 creator_id uuid [not null]
 created_at timestamp [not null, default: `now()`]
 updated_at timestamp
}

Table subscriptions {
 id int [primary key, increment]
 profile_id uuid [not null]
 challenge_id int [not null]
 created_at timestamp [not null, default: `now()`]

 indexes {
   (profile_id, challenge_id) [unique]
 }
}

Table participations {
 id int [primary key, increment]
 profile_id uuid [not null]
 challenge_id int [not null]
 video_url varchar [not null]
 screenshot_url varchar
 description text
 upvotes int [not null, default: 0]
 downvotes int [not null, default: 0]
 status varchar [not null, default: 'pending']
 created_at timestamp [not null, default: `now()`]
 updated_at timestamp
}

Table votes {
 id int [primary key, increment]
 participation_id int [not null]
 profile_id uuid [not null]
 value smallint [not null]
 created_at timestamp [not null, default: `now()`]

 indexes {
   (participation_id, profile_id) [unique]
 }
}

Table badges {
 id int [primary key, increment]
 name varchar [not null, unique]
 description text [not null]
 icon_url varchar
 created_at timestamp [not null, default: `now()`]
}

Table user_badges {
 id int [primary key, increment]
 profile_id uuid [not null]
 badge_id int [not null]
 challenge_id int
 awarded_at timestamp [not null, default: `now()`]

 indexes {
   (profile_id, badge_id, challenge_id) [unique]
 }
}

Ref: profiles.id - users.id
Ref: challenges.creator_id > profiles.id
Ref: challenges.game_id > games.id
Ref: subscriptions.profile_id > profiles.id
Ref: subscriptions.challenge_id > challenges.id
Ref: participations.profile_id > profiles.id
Ref: participations.challenge_id > challenges.id
Ref: votes.participation_id > participations.id
Ref: votes.profile_id > profiles.id
Ref: user_badges.profile_id > profiles.id
Ref: user_badges.badge_id > badges.id
Ref: user_badges.challenge_id > challenges.id
```