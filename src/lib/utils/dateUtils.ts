export function formatDate(timestamp: number, locale: string | null | undefined): string {
    const date = new Date(timestamp);
    const currentLocale = locale || 'en';

    if (currentLocale === 'crh') {
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'Mayıs', 'İyün', 'İyül', 'Avgust', 'Sentâbr', 'Oktâbr', 'Noyabr', 'Dekabr'];
        return `${day} ${months[monthIndex]} ${year}`;
    }

    // For Ukrainian, standard Intl sometimes adds 'р.' or might not use Genitive correctly depending on browser. 
    // But usually modern browsers handle uk-UA well.
    // '9 грудня 2025'

    let formatted = date.toLocaleDateString(currentLocale, { year: 'numeric', month: 'long', day: 'numeric' });

    // Remove "р." suffix if present (common in Ukrainian/Russian locale output)
    if (currentLocale === 'uk') {
        formatted = formatted.replace(' р.', '').replace(' р', '');
    }

    return formatted;
}
