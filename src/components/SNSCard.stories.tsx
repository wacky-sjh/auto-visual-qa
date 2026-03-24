import type { Meta, StoryObj } from '@storybook/react';
import SNSCard from './SNSCard';

const meta = {
  title: 'Components/SNSCard',
  component: SNSCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SNSCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    // 픽셀 검수를 위한 오버레이 이미지 설정
    overlay: {
      url: '/SNSCard.png',
    },
  },
};
