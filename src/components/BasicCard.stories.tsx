import type { Meta, StoryObj } from '@storybook/react';
import BasicCard from './BasicCard';

const meta = {
  title: 'Components/BasicCard',
  component: BasicCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BasicCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    // 픽셀 검수를 위한 오버레이 이미지 설정
    overlay: {
      url: '/baseline.png', // output 폴더 안의 baseline.png 참조
    },
  },
};
