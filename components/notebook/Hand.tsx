import { Text, TextProps } from 'react-native';

export function Txt({ children, ...props }: TextProps) {
	return (
		<Text {...props}>
			{children}
			{' '}
		</Text>
	);
}
