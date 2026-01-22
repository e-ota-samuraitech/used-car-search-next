import Image from 'next/image';

const SearchLogo = () => {
  return (
    <div className="text-center mb-6 md:mb-8">
      {/* Logo Image */}
      <div className="mb-3 md:mb-4">
        <Image
          src="/readdy-logo.png"
          alt="中古車速報"
          width={96}
          height={96}
          className="h-16 md:h-24 w-auto mx-auto"
          priority
        />
      </div>
      {/* Site Title */}
      <h1 className="text-xl md:text-2xl font-normal text-gray-700 mb-2">
        中古車速報
      </h1>
      {/* Subtitle */}
      <p className="text-sm md:text-base text-gray-500">
        更新が早い中古車を、最新情報から探せます
      </p>
    </div>
  );
};

export default SearchLogo;
