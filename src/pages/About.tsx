import { ExternalLink, Github, Heart, ShieldCheck } from 'lucide-react';
import { useAtlas } from '../atlas/context';
import { UPSTREAM_URL } from '../config';
import { faNumber } from '../i18n';
import { go } from '../lib/router';
import { Categories } from '../ui/Categories';
import { Logo } from '../ui/Logo';

export function About() {
  const atlas = useAtlas();
  return <div className="page about"><header className="page-head"><Logo /><h1 className="display">واژه‌ها، برای همه.</h1><p className="lede">اطلس تصویری انگلیسی برای فارسی‌زبانان؛ آزاد، متن‌باز و همیشه در حال رشد.</p></header>
    <section className="panel about-intro"><Heart size={27} /><h2>از یک واژه، تا یک دنیا</h2><p>مهردادیکا بر پایهٔ پروژهٔ Word Atlas ساخته شده است. همان تصویرها، کشف واژه‌ها و مرور هوشمند، با تجربه‌ای فارسی و مجموعه‌هایی برای زندگی، آشپزی، پزشکی، مهندسی و موضوع‌های بیشتر.</p><p>اکنون {faNumber(atlas.count)} واژه و عبارت در این نسخهٔ آزمایشی در دسترس است. هر مجموعه پس از آماده‌شدن به اطلس افزوده می‌شود؛ پیشرفت شما با انتشار مجموعه‌های تازه باقی می‌ماند.</p></section>
    <div className="me-grid"><section className="panel"><ShieldCheck size={25} /><h2>پیشرفت، روی دستگاه شما</h2><p>برای یادگیری حساب کاربری لازم نیست. پاسخ‌ها و تنظیمات در مرورگر شما ذخیره می‌شوند. پیش از جابه‌جایی دستگاه یا پاک‌کردن داده‌های مرورگر، از بخش «من» نسخهٔ پشتیبان بگیرید.</p><p>صداهای واژه‌ها از فایل‌های همراه پخش می‌شوند. در موارد دیگر، خواندن با صدای دستگاه اختیاری است و به صداهای در دسترس مرورگر بستگی دارد.</p></section><section className="panel"><Github size={25} /><h2>متن‌باز و قابل مشارکت</h2><p>کد با مجوز MIT و محتوای آموزشی با مجوز CC BY 4.0 ارائه می‌شود. نام پدیدآورندگان و مجوز هر دارایی حفظ می‌شود.</p><p>محتوای آغازین با کمک هوش مصنوعی آماده شده و در کانال پیش‌نمایش است. تأیید انسانی یا تخصصی برای آن ادعا نمی‌شود. انتشار پایدار به بررسی ثبت‌شدهٔ ویراستار و، در موضوع‌های تخصصی، متخصص نیاز دارد.</p><a className="link" href={UPSTREAM_URL} target="_blank" rel="noreferrer">پروژهٔ اصلی Word Atlas <ExternalLink size={15} /></a></section></div>
    <section className="panel credits"><h2>سپاس و مجوزها</h2><p>تصویرها، صدای واژه‌ها و بخشی از دادهٔ انگلیسی: <a href={UPSTREAM_URL}>Word Atlas contributors</a> — <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>. ترجمه‌ها و مثال‌های فارسی و ساختار موضوعی تغییر کرده‌اند. این اقتباس مستقل است.</p><p>حروف فارسی: <a href={`${import.meta.env.BASE_URL}licenses/Vazirmatn-OFL.txt`}>Vazirmatn، مجوز OFL</a> · حروف انگلیسی: <a href={`${import.meta.env.BASE_URL}licenses/Fraunces-OFL.txt`}>Fraunces، مجوز OFL</a> · نمادها: Lucide · زمان‌بندی مرور: ts-fsrs.</p></section>
    <section className="topics-panel"><h2>نقشهٔ مجموعه‌ها</h2><p className="muted">همهٔ ۳۲ حوزه از ابتدا در نقشه حضور دارند. «به‌زودی» یعنی هنوز واژه‌ای در آن مجموعه منتشر نشده است.</p><Categories expanded onSelect={topic => go({ page: 'atlas', topic })} /></section>
  </div>;
}
