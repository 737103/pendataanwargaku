
import Image from 'next/image';

export function WargaDataLogo() {
  return (
    <div className="flex items-center gap-2 font-headline text-lg font-bold">
      <div className="relative h-[80px] w-[80px]">
        <Image
          src="/logo-wargadata.png"
          alt="WargaKu Logo"
          fill
          className="object-contain"
          data-ai-hint="logo"
        />
      </div>
      <span>WargaKu</span>
    </div>
  );
}
