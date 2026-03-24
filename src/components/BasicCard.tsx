import * as React from 'react';
import { cn } from '@/lib/utils';
import mosaic from '@/assets/images/mosaic.png';
import { Typography } from './ui/typography';

const cardImage =
  'https://www.figma.com/api/mcp/asset/52cbf6c9-74a6-4b53-a379-f9ee911b4b25';

type BasicCardProps = React.HTMLAttributes<HTMLDivElement>;

export default function BasicCard({ className, ...props }: BasicCardProps) {
  return (
    <div
      data-qa="basic-card"
      className={cn(
        'flex w-full max-w-[350px] flex-col rounded-[20px] bg-white',
        className
      )}
      {...props}
    >
      <div className="h-[316px] w-full overflow-hidden rounded-t-[20px]">
        <img
          alt="card image"
          src={mosaic}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex h-[184px] w-full flex-col justify-center gap-[6px] rounded-b-[20px] border border-t-0 border-gray-400 bg-white px-[32px]">
        <p className="text-[24px] font-semibold leading-normal text-primary">
          🧬 AI
        </p>
        <Typography variant="h4" className="text-black line-clamp-2">
          Lorem ipsum dolor sit amet consect. Vestibulum eget cursus eget
          ultricies facilisi ornare. At molestie eros sagittis arcu bibendum
          quam aliquam faucibus.
        </Typography>
        <Typography variant="body3" className="text-black line-clamp-1">
          Lorem ipsum dolor sit amet consect. Vestibulum eget cursus eget
          ultricies facilisi ornare. At molestie eros sagittis arcu bibendum
          quam aliquam faucibus.
        </Typography>
      </div>
    </div>
  );
}
