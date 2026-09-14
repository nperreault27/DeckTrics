import { useState } from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';

export type StackedBar = {
  label: string;
  stacks: {
    value: number;
    color: string;
    label?: string;
  }[];
};

type Props = {
  data: StackedBar[];
  height?: number;
  withTooltip?: boolean;
  onPress?: (
    bar: StackedBar,
    stackIndex: number,
    value: number
  ) => void;
};

export function SvgStackedBarChart({
  data,
  height = 240,
  withTooltip = false,
  onPress,
}: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const [selected, setSelected] = useState<{
    barIndex: number;
    stackIndex: number;
  } | null>(null);

  const width = Math.max(280, windowWidth - 32);

  const padding = {
    top: 24,
    right: 16,
    bottom: 48,
    left: 48,
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const slotWidth = chartWidth / Math.max(data.length, 1);
  const barWidth = Math.min(48, slotWidth * 0.6);

  const selectedBar = selected ? data[selected.barIndex] : undefined;
  const selectedStack = selectedBar?.stacks[selected!.stackIndex];

  const selectedBarX = selected
    ? padding.left +
      slotWidth * selected.barIndex +
      (slotWidth - barWidth) / 2
    : 0;

  let selectedOffset = 0;

  if (selectedBar && selectedStack) {
    for (let index = 0; index < selected!.stackIndex; index += 1) {
      selectedOffset +=
        (selectedBar.stacks[index].value / 100) * chartHeight;
    }
  }

  const selectedStackHeight = selectedStack
    ? (selectedStack.value / 100) * chartHeight
    : 0;

  const selectedStackY =
    padding.top +
    chartHeight -
    selectedOffset -
    selectedStackHeight;

  const tooltipWidth = 140;
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
    selectedStackY - tooltipHeight - 8
  );

  return (
    <Svg width={width} height={height}>
      {[0, 20, 40, 60, 80, 100].map((value) => {
        const y =
          padding.top + chartHeight - (value / 100) * chartHeight;

        return (
          <G key={value}>
            <Line
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#444"
            />

            <SvgText
              x={padding.left - 8}
              y={y + 4}
              fill="#aaa"
              fontSize={10}
              textAnchor="end"
            >
              {value}%
            </SvgText>
          </G>
        );
      })}

      {data.map((bar, barIndex) => {
        const x =
          padding.left +
          slotWidth * barIndex +
          (slotWidth - barWidth) / 2;

        let offset = 0;

        return (
          <G key={`${bar.label}-${barIndex}`}>
            {bar.stacks.map((stack, stackIndex) => {
              const stackHeight =
                (stack.value / 100) * chartHeight;

              const y =
                padding.top +
                chartHeight -
                offset -
                stackHeight;

              offset += stackHeight;

              return (
                <Rect
                  key={stackIndex}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={stackHeight}
                  fill={stack.color}
                  onPress={() => {
                    setSelected((current) =>
                      current?.barIndex === barIndex &&
                      current.stackIndex === stackIndex
                        ? null
                        : { barIndex, stackIndex }
                    );

                    onPress?.(bar, stackIndex, stack.value);
                  }}
                />
              );
            })}

            <SvgText
              x={x + barWidth / 2}
              y={height - 18}
              fill="#aaa"
              fontSize={10}
              textAnchor="middle"
            >
              {bar.label}
            </SvgText>
          </G>
        );
      })}

      {withTooltip && selectedBar && selectedStack && (
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
            {selectedBar.label}
          </SvgText>

          <SvgText
            x={tooltipX + tooltipWidth / 2}
            y={tooltipY + 35}
            fill="#8ab4f8"
            fontSize={11}
            textAnchor="middle"
          >
            {selectedStack.label ?? `${selectedStack.value}%`}
          </SvgText>
        </G>
      )}
    </Svg>
  );
}