# Database

Tables

## users

- id
- username
- email
- avatar
- elo

## games

- id
- white_player
- black_player
- status
- result
- created_at

## moves

- game_id
- move_number
- san
- fen

## friends

- user_id
- friend_id

## achievements

- id
- user_id
- badge