export const faNumber = (n: number) => n.toLocaleString('fa-IR');
export const normalizeSearch = (text: string) => text.normalize('NFKC').toLowerCase().replace(/ي/g, 'ی').replace(/ك/g, 'ک').replace(/[\u064B-\u065F\u0670]/g, '').replace(/[\u200c\u200d\s]+/g, ' ').trim();
export const levelNames = ['آغازین', 'پایه', 'متوسط', 'فراتر از متوسط', 'پیشرفته', 'تسلط'];
