export type EmojiStyle = 'color' | 'mono';

export const EMOJI_CONFIG = {
    // Змінюєте це значення - змінюються всі емодзі в додатку
    style: 'color' as EmojiStyle,

    // Шляхи до папок (відносно static)
    paths: {
        color: '/emojis/color',
        mono: '/emojis/mono'
    }
};