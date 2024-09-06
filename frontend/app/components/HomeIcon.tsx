import Image from "next/image";
import Link from "next/link";

export default function HomeIcon() {
  return (
    <Link href="/" className="fixed top-4 left-4 z-50">
      <Image
        src="/icon.ico"
        alt="Home"
        width={32}
        height={32}
        className="hover:opacity-80 transition-opacity"
        unoptimized={true}
      />
    </Link>
  );
}
