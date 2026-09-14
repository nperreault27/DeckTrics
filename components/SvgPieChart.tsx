import { useState } from 'react';
import Svg, {
  Circle,
  G,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';

export type PieItem = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: PieItem[];
  size?: number;
  withTooltip?: boolean;
  onPress?: (item: PieItem, index: number) => void;
};

function point(
  center: number,
  radius: number,
  angle: number
) {
  const radians = ((angle - 90) * Math.PI) / 180;

  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

function slicePath(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const start = point(center, radius, endAngle);
  const end = point(center, radius, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${center} ${center}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

export function SvgPieChart({
  data,
  size = 240,
  withTooltip = false,
  onPress,
}: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const center = size / 2;
  const radius = size / 2 - 8;

  let currentAngle = 0;

  const selectedItem =
    selectedIndex === null ? undefined : data[selectedIndex];

  return (
    <Svg width={size} height={size}>
      {data.map((item, index) => {
        const percentage = total > 0 ? item.value / total : 0;
        const startAngle = currentAngle;
        const endAngle = currentAngle + percentage * 360;

        currentAngle = endAngle;

        const handlePress = () => {
          setSelectedIndex((current) =>
            current === index ? null : index
          );
          onPress?.(item, index);
        };

        if (percentage >= 0.9999) {
          return (
            <Circle
              key={`${item.label}-${index}`}
              cx={center}
              cy={center}
              r={radius}
              fill={item.color}
              onPress={handlePress}
            />
          );
        }

        return (
          <Path
            key={`${item.label}-${index}`}
            d={slicePath(
              center,
              radius,
              startAngle,
              endAngle
            )}
            fill={item.color}
            onPress={handlePress}
          />
        );
      })}

      {withTooltip && selectedItem && (
        <G pointerEvents="none">
          <Rect
            x={center - 70}
            y={8}
            width={140}
            height={44}
            rx={6}
            fill="#444"
          />

          <SvgText
            x={center}
            y={26}
            fill="#fff"
            fontSize={11}
            textAnchor="middle"
          >
            {selectedItem.label}
          </SvgText>

          <SvgText
            x={center}
            y={43}
            fill="#8ab4f8"
            fontSize={11}
            textAnchor="middle"
          >
            {selectedItem.value} games
          </SvgText>
        </G>
      )}
    </Svg>
  );
}