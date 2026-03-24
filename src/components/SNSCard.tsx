import * as React from 'react';
import { cn } from '@/lib/utils';
import mosaic from '@/assets/images/mosaic.png';

type SNSCardProps = React.HTMLAttributes<HTMLDivElement>;

export default function SNSCard({ className, ...props }: SNSCardProps) {
  return (
    <div
      data-qa="sns-card"
      className={cn(
        'relative flex w-[350px] aspect-[350/530] overflow-hidden rounded-[32px] bg-gray-100 shadow-xl',
        className
      )}
      {...props}
    >
      {/* Background Image */}
      <img
        alt="sns card image"
        src={mosaic}
        className="absolute inset-0 h-full w-full object-cover"
      />
      
      {/* Bottom Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content Container (Bottom) */}
      <div className="absolute bottom-0 left-0 flex w-full flex-col gap-[12px] p-[24px] pb-[32px]">
        {/* Tag Component */}
        <div className="flex">
          <span className="inline-flex items-center rounded-full border border-white/60 px-[14px] py-[4px] text-[14px] font-medium text-white">
            Tag
          </span>
        </div>

        {/* Title & Info */}
        <div className="flex flex-col gap-[4px]">
          <h3 className="text-[28px] font-bold leading-tight text-white">
            Lorem ipsum <span className="text-[20px] font-normal opacity-80">(Lorem)</span>
          </h3>
          <p className="text-[16px] font-medium text-white/90">
            Lorem ipsum dolor sit amet consect.
          </p>
        </div>
      </div>
    </div>
  );
}
