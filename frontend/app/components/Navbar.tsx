import BackgroundMusic from './BackgroundMusic';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 flex justify-end items-center p-4 z-50">
      <div className="flex items-center">
        <BackgroundMusic />
        <Link href="/" className="ml-4 hover:opacity-80 transition-opacity">
          <Image
            src="/icon.ico"
            alt="Home"
            width={32}
            height={32}
            unoptimized={true}
          />
        </Link>
      </div>
    </nav>
  );
}

