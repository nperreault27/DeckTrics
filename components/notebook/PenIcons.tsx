import Svg, { Path } from 'react-native-svg';
import { ink } from '@/lib/notebook';

type IconProps = { color?: string; size?: number };

function PenPath({ d, color, size, width = 2 }: { d: string; color: string; size: number; width?: number }) {
	return (
		<Svg width={size} height={size} viewBox='0 0 24 24'>
			<Path d={d} stroke={color} strokeWidth={width} strokeLinecap='round' strokeLinejoin='round' fill='none' />
		</Svg>
	);
}

export function ChevronDown({ color = ink.faint, size = 14 }: IconProps) {
	return <PenPath d='M5 9.2 C 8 12, 10 14, 12.2 15.6 C 14.5 13.6, 16.8 11.4, 19 8.6' color={color} size={size} width={2.4} />;
}

export function ChevronLeft({ color = ink.blue, size = 20 }: IconProps) {
	return <PenPath d='M15.2 4.8 C 12.6 7.4, 10.4 9.8, 8.4 12.2 C 10.6 14.4, 12.8 16.8, 15.6 19.4' color={color} size={size} width={2.2} />;
}

// Three pen lines, used as a drag handle.
export function Handle({ color = ink.faint, size = 20 }: IconProps) {
	return <PenPath d='M4.5 7.2 L19.2 6.8 M4.8 12.1 L19.5 12.2 M4.4 17.1 L19 17.4' color={color} size={size} width={1.8} />;
}

export function Plus({ color = ink.blue, size = 20 }: IconProps) {
	return <PenPath d='M12.2 5 C 12 9, 11.9 14, 12 19.2 M5 12.3 C 9.2 12, 14.6 11.9, 19.2 12.1' color={color} size={size} />;
}

export function Minus({ color = ink.faint, size = 20 }: IconProps) {
	return <PenPath d='M5 12.3 C 9.2 12, 14.6 11.9, 19.2 12.1' color={color} size={size} />;
}
