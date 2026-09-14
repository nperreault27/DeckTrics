import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Tooltip } from 'react-native-paper';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

export type BarItem = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  data: BarItem[];
  height?: number;
  maxValue?: number;
  color?: string;
  yLabelSuffix?: string;
  withTooltip?: boolean;
  onPress?: (item: BarItem, index: number) => void;
};

export function SvgBarChart({
  data,
  height = 240,
  maxValue,
  color = '#8ab4f8',
  yLabelSuffix = '',
  withTooltip = false,
  onPress,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const width = Math.max(280, windowWidth - 32);

  const padding = {
    top: 24,
    right: 16,
    bottom: 56,
    left: 48,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const highestValue = maxValue ?? Math.max(1, ...data.map((item) => item.value));
  const slotWidth = chartWidth / Math.max(data.length, 1);
  const barWidth = Math.min(42, slotWidth * 0.6);

  const selectedItem =
    selectedIndex === null ? undefined : data[selectedIndex];

  const selectedBarX =
    selectedIndex === null
      ? 0
      : padding.left +
        slotWidth * selectedIndex +
        (slotWidth - barWidth) / 2;

  const selectedBarHeight = selectedItem
    ? (selectedItem.value / highestValue) * chartHeight
    : 0;

  const tooltipWidth = 150;
  const tooltipHeight = 44;

  const tooltipX = Math.max(
    4,
    Math.min(
      width - tooltipWidth - 4,
      selectedBarX + barWidth / 2 - tooltipWidth / 2
    )
  );

  const tooltipY = Math.max(
    4,
    padding.top + chartHeight - selectedBarHeight - tooltipHeight - 8
  );

  return (
    <Svg width={width} height={height}>
      {[0, 25, 50, 75, 100].map((percent) => {
        const y =
          padding.top + chartHeight - (percent / 100) * chartHeight;

        return (
          <G key={percent}>
            <Line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#444"
              strokeWidth={1}
            />

            <SvgText
              x={padding.left - 8}
              y={y + 4}
              fill="#aaa"
              fontSize={10}
              textAnchor="end"
            >
              {Math.round((percent / 100) * highestValue)}
              {yLabelSuffix}
            </SvgText>
          </G>
        );
      })}

      {data.map((item, index) => {
        const barHeight = (item.value / highestValue) * chartHeight;
        const x =
          padding.left +
          slotWidth * index +
          (slotWidth - barWidth) / 2;
        const y = padding.top + chartHeight - barHeight;

        return (
          <G key={`${item.label}-${index}`}>
            <Tooltip title={`${item.label}: ${item.value}%`}>
                <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={4}
                fill={item.color ?? color}
                onPress={() => {
                    setSelectedIndex((current) =>
                    current === index ? null : index
                    );
                }}
                />
            </Tooltip>

            <SvgText
              x={x + barWidth / 2}
              y={height - 22}
              fill="#aaa"
              fontSize={10}
              textAnchor="middle"
            >
              {item.label}
            </SvgText>
          </G>
        );
      })}

      {withTooltip && selectedItem && (
        <G pointerEvents="none">
          <Rect
            x={tooltipX}
            y={tooltipY}
            width={tooltipWidth}
            height={tooltipHeight}
            rx={6}
            fill="#444"
          />

          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + 18}
            fill="#fff"
            fontSize={11}
            textAnchor="middle"
          >
            {selectedItem.label}
          </SvgText>

          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + 35}
            fill="#8ab4f8"
            fontSize={11}
            textAnchor="middle"
          >
            {selectedItem.value}
            {yLabelSuffix}
          </SvgText>
        </G>
      )}
    </Svg>
  );
}