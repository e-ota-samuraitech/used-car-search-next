import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-3.5 py-3.5 flex gap-3 items-center justify-between flex-wrap text-xs text-muted">
        <div>運営会社：ダミー株式会社</div>
        <div className="flex gap-3 flex-wrap items-center">
          <Link href="/terms" className="underline underline-offset-2">
            利用規約
          </Link>
          <Link href="/privacy" className="underline underline-offset-2">
            個人情報保護方針
          </Link>
          <Link href="/contact" className="underline underline-offset-2">
            お問い合わせ
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
